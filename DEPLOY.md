# Monetrex — Deployment Guide

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [The Critical Blocker](#2-the-critical-blocker)
3. [Option A — Vercel + Fly.io (Recommended)](#3-option-a--vercel--flyio-recommended)
4. [Option B — Vercel + Render.com](#4-option-b--vercel--rendercom)
5. [Option C — Full Vercel + Turso](#5-option-c--full-vercel--turso)
6. [Edge Cases & Gotchas](#6-edge-cases--gotchas)
7. [Pre-Deploy Checklist](#7-pre-deploy-checklist)

---

## 1. Architecture Overview

| Layer | Current (dev) | Option A (prod) | Option B (prod) | Option C (prod) |
|---|---|---|---|---|
| Frontend | `localhost:5173` (Vite) | Vercel CDN | Vercel CDN | Vercel CDN |
| API | `localhost:3001` (Express) | Fly.io (Docker + Node) | Render.com (Node) | Vercel Serverless Functions |
| Database | `server/data/monetrex.db` (SQLite file) | SQLite on Fly.io volume (persistent) | SQLite on Render disk (ephemeral on free tier) | Turso (cloud SQLite) |

The frontend calls the API via `VITE_API_URL` — this env var is the only hardcoded coupling between the two layers. Both options keep that contract.

---

## 2. The Critical Blocker

**`better-sqlite3` cannot run on Vercel serverless.**

Vercel runs API routes as AWS Lambda functions. Two problems:

1. **Native module**: `better-sqlite3` uses C++ bindings (node-gyp). Vercel's build environment cannot compile native modules. The build will fail with a node-gyp/prebuild error.

2. **Ephemeral filesystem**: Even if it compiled, Lambda functions have no persistent disk. Every cold start would start with an empty `monetrex.db`, losing all user data.

This means **you cannot deploy the Express server as-is to Vercel**. You have two paths:

- **Option A** — Keep the Express + SQLite stack, host backend on Render.com (persistent VM, not serverless). Only the frontend goes to Vercel.
- **Option B** — Rewrite the backend to Vercel serverless functions and swap `better-sqlite3` for `@libsql/client` (Turso — a cloud SQLite with pure-JS driver).

---

## 3. Option A — Vercel + Fly.io (Recommended)

**Effort: Low. No code changes. No database migration. Data persists across restarts.**

### Why Fly.io over Render free tier

Render's free tier has an ephemeral filesystem — every restart wipes `monetrex.db`. Fly.io runs your app in a real VM and lets you attach a **persistent volume** that survives restarts, redeployments, and idle sleep. The SQLite file lives on the volume, not the container — so data is never lost.

| | Render free | Fly.io free |
|---|---|---|
| Persistent storage | No (`/tmp` only) | Yes (volumes, 3 GB free) |
| Spin-down on idle | Yes (15 min) | Yes — but **volume persists** |
| Data loss on restart | Yes | No |
| Native modules (`better-sqlite3`) | Yes (builds fine) | Yes (Dockerfile with build tools) |
| Monthly cost | $0 | $0 (within free allowance) |

### How it works

```
Browser → Vercel CDN (React SPA)
             ↓ API calls
         Fly.io VM (Express + Docker)
             ↓ reads/writes
         Fly.io Volume /data/monetrex.db  ← persists forever
```

### 3.1 Files already committed

- `Dockerfile` — multi-stage build: compiles `better-sqlite3` native binding, then builds a lean runtime image
- `fly.toml` — Fly.io config with volume mount at `/data` and `DATA_DIR=/data` env var
- `.dockerignore` — excludes `src/`, `dist/`, `graphify-out/` so only server code goes into the image

### 3.2 Setup steps

**Install flyctl** (Fly.io CLI):
```bash
curl -L https://fly.io/install.sh | sh   # Linux/Mac
# OR: brew install flyctl                 # Mac
# OR: see https://fly.io/docs/hands-on/install-flyctl/
```

**Sign up / log in:**
```bash
fly auth signup   # new account
# OR
fly auth login
```

**Create the app** (must be globally unique):
```bash
fly apps create monetrex-api   # or any name you want
```
> Update the `app` field in `fly.toml` to match the name you chose.

**Create the persistent volume** (one-time, data lives here forever):
```bash
fly volumes create monetrex_data --region sin --size 1
# sin = Singapore (closest free region to India)
# Alternatives: bom (Mumbai), fra (Frankfurt), lax (Los Angeles)
```

**Set secrets** (sensitive env vars — never go in fly.toml):
```bash
fly secrets set \
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" \
  CSRF_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" \
  ALLOWED_ORIGINS="https://your-app.vercel.app"
```
Optional extras:
```bash
fly secrets set \
  RESEND_API_KEY="re_xxxx" \
  RESEND_FROM_EMAIL="noreply@yourdomain.com" \
  APP_URL="https://your-app.vercel.app" \
  ADMIN_SECRET="a-random-secret-for-db-download"
```

**Deploy:**
```bash
fly deploy
```
First build takes ~3–5 minutes (Docker + node-gyp for `better-sqlite3`). Subsequent deploys are faster (Docker layer cache).

**Copy the app URL** shown at the end of `fly deploy` (e.g. `https://monetrex-api.fly.dev`).

### 3.3 Vercel setup (frontend)

Same as before — set `VITE_API_URL` to the Fly.io URL:
```
VITE_API_URL = https://monetrex-api.fly.dev/api
```
Redeploy Vercel after setting the env var.

### 3.4 Verify data persistence

```bash
fly ssh console          # SSH into the running VM
ls /data/                # should show monetrex.db
exit

fly machine restart      # force restart
fly ssh console
ls /data/                # monetrex.db still there ✅
```

---

## 4. Option B — Vercel + Render.com

**Effort: Low. No code changes needed. But data is lost on every restart on the free tier — use Option A (Fly.io) instead. This option is only viable if you add a Render Persistent Disk ($1/GB/month).**

### How it works

```
Browser → Vercel CDN (React SPA)
             ↓ API calls
         Render.com (Express + SQLite on disk)
```

The Vercel-hosted frontend talks to the Render-hosted backend via `VITE_API_URL`. CORS is updated to allow the Vercel domain.

### 4.1 Code changes — ✅ already implemented

#### `server/index.js` — CORS uses `ALLOWED_ORIGINS` env var ✅
CORS no longer hardcodes localhost. It reads `ALLOWED_ORIGINS` from the environment, falling back to localhost for local dev:
```js
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
```
Set `ALLOWED_ORIGINS=https://your-app.vercel.app` on Render.

#### `vercel.json` — SPA catch-all ✅
Created at project root. Without this, refreshing any route like `/dashboard` or `/analytics` returns a 404 from Vercel's CDN.
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

#### `.vercelignore` — excludes backend from Vercel build ✅
Created at project root. Prevents Vercel from trying to compile `better-sqlite3` (a native C++ module) during `npm install`:
```
server/
graphify-out/
```

### 4.2 Vercel setup (frontend)

1. Push code to GitHub.
2. Import repo in Vercel dashboard.
3. Vercel auto-detects Vite — no framework config needed.
4. Set **Environment Variables** in Vercel project settings:
   ```
   VITE_API_URL = https://your-backend.onrender.com/api
   ```
   > `VITE_` prefix required — Vite only exposes variables with this prefix to browser code.
5. Deploy. Build command: `npm run build`. Output dir: `dist`.

### 4.3 Render.com setup (backend)

1. Go to [render.com](https://render.com) → **New → Web Service** → connect your GitHub repo.
2. Render auto-detects `render.yaml` — review and confirm the settings.
3. In the Render dashboard, set the following **Environment Variables** (these are marked `sync: false` in `render.yaml` and must be entered manually):
   ```
   JWT_SECRET       = <generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
   CSRF_SECRET      = <generate a second random secret the same way>
   ALLOWED_ORIGINS  = https://your-app.vercel.app
   RESEND_API_KEY   = re_xxxx  (only if using password reset emails)
   RESEND_FROM_EMAIL = noreply@yourdomain.com
   APP_URL          = https://your-app.vercel.app
   ```
4. Deploy. First build takes ~2–3 minutes (`npm install` + node-gyp for `better-sqlite3`).
5. Copy the service URL (e.g. `https://monetrex-api.onrender.com`).
6. In Vercel project settings → Environment Variables, set:
   ```
   VITE_API_URL = https://monetrex-api.onrender.com/api
   ```
7. Redeploy the Vercel frontend so the new `VITE_API_URL` is baked into the bundle.

### 4.4 Free-tier persistence warning ⚠️

Render's free tier has an **ephemeral filesystem** — `monetrex.db` is wiped on every redeploy and after the service spins down due to inactivity (15 min). Free tier is only suitable for demos and testing.

| Scenario | Outcome |
|---|---|
| Push a new commit | `monetrex.db` wiped on redeploy |
| Service idles 15+ min | Container restarts; db wiped; ~30 s cold start |
| Render maintenance | db wiped |

**To persist data**, add a Render Persistent Disk ($1/GB/month). In `render.yaml`, add a `disk` block and set `DATA_DIR`:

```yaml
# append inside the service entry in render.yaml:
    disk:
      name: monetrex-db
      mountPath: /var/data
      sizeGB: 1
```

Then add `DATA_DIR=/var/data` as an environment variable on Render. The server already reads `process.env.DATA_DIR` in `server/database.js`.

---

## 5. Option C — Full Vercel + Turso

**Effort: Medium. Requires replacing the database driver and rewriting all DB calls from sync to async. All SQL queries stay the same.**

### How it works

```
Browser → Vercel CDN (React SPA)
             ↓ API calls (same-origin, /api/*)
         Vercel Serverless Functions (Express adapted via @vercel/node or raw handlers)
             ↓
         Turso (cloud SQLite, pure-JS @libsql/client)
```

### 5.1 Why Turso works where better-sqlite3 doesn't

Turso is a hosted fork of SQLite (libSQL). Its JS client `@libsql/client` is **pure JavaScript** (no native bindings), so it builds fine on Vercel. It speaks a superset of SQLite SQL, so all existing queries run unchanged. The only difference: the API is async (`await db.execute(...)`) instead of synchronous.

### 5.2 Code changes required

#### Step 1 — Replace the DB driver

```bash
npm uninstall better-sqlite3
npm install @libsql/client
```

#### Step 2 — Rewrite `server/database.js`

```js
import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_URL,            // e.g. libsql://your-db.turso.io
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Run schema migrations on startup
await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS users ( ... );
  CREATE TABLE IF NOT EXISTS groups_tbl ( ... );
  -- ... rest of schema
`);
```

#### Step 3 — Convert all sync DB calls to async

`better-sqlite3` is synchronous: `db.prepare(...).get(...)`. `@libsql/client` is async: `await db.execute(...)`. Every route handler needs to become async and every DB call needs `await`.

Example conversion:
```js
// Before (better-sqlite3)
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

// After (@libsql/client)
const result = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [req.userId] });
const user = result.rows[0];
```

Transactions also change:
```js
// Before
const tx = db.transaction(() => { ... });
tx();

// After
await db.batch([
  { sql: 'INSERT INTO ...', args: [...] },
  { sql: 'INSERT INTO ...', args: [...] },
]);
```

#### Step 4 — Adapt Express for Vercel serverless

Create `api/index.js` at the project root:
```js
import app from '../server/index.js'; // export `app` from server/index.js
export default app;
```

Update `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)",     "destination": "/index.html"  }
  ]
}
```

#### Step 5 — Environment variables on Vercel

```
JWT_SECRET         = <secret>
TURSO_URL          = libsql://your-db.turso.io
TURSO_AUTH_TOKEN   = <token from Turso dashboard>
VITE_API_URL       = /api   # same-origin! no separate backend URL needed
```

### 5.3 Turso free tier limits

| Resource | Free limit |
|---|---|
| Storage | 500 MB |
| Row reads | 1 billion / month |
| Row writes | 25 million / month |
| Databases | 3 |

More than enough for a personal/small-team expense app.

---

## 6. Edge Cases & Gotchas

### 6.1 CORS ✅ fixed
- ~~Hardcoded `['http://localhost:5173', 'http://localhost:4173']`~~ — now reads from `ALLOWED_ORIGINS` env var.
- Still requires setting `ALLOWED_ORIGINS=https://your-app.vercel.app` on Render before the first backend deploy.
- Add both the Vercel URL and any custom domain as a comma-separated list if needed.

### 6.2 `VITE_API_URL` build-time baking
- Vite bakes env vars into the JS bundle at **build time**, not runtime.
- You must set `VITE_API_URL` in Vercel's **project settings → Environment Variables** *before* triggering a build.
- Changing it after a build requires a redeploy.
- Symptom if missing: the frontend falls back to `http://localhost:3001/api` (hardcoded in `src/utils/api.js`), all API calls fail silently in production.

### 6.3 SPA routing (404 on refresh) ✅ fixed
- `vercel.json` is committed with the catch-all rewrite rule.
- React Router only handles routing *after* `index.html` is loaded. The CDN must always serve `index.html` for non-asset paths — this is now handled.

### 6.4 JWT secret rotation
- All existing tokens are signed with `JWT_SECRET`. Changing the secret in production invalidates every active session — all users are logged out simultaneously.
- Plan: only rotate the secret intentionally (security incident), not casually.

### 6.5 SQLite WAL mode on Fly.io
- `db.pragma('journal_mode = WAL')` works fine on Fly.io volumes.
- The WAL sibling files (`monetrex.db-shm`, `monetrex.db-wal`) all live under `DATA_DIR=/data` on the volume — they persist together correctly.

### 6.6 `better-sqlite3` build failure on Vercel ✅ fixed
- `.vercelignore` is committed, excluding `server/` and `graphify-out/` from Vercel's build context.
- Vercel will not see `better-sqlite3` in its dependency tree and will not attempt to compile it.
- No changes to `package.json` or install commands needed.

### 6.7 Database migration (first deploy)
- The schema uses `CREATE TABLE IF NOT EXISTS` — idempotent, safe to run on every cold start.
- No separate migration runner needed for initial deploy.
- Future schema changes need a migration strategy (ALTER TABLE or versioned migration files).

### 6.8 `bcryptjs` vs `bcrypt`
- Already using `bcryptjs` (pure JavaScript). No native module issues. No action needed.

### 6.9 Rate limiting on auth endpoints ✅
- `express-rate-limit` is already applied globally and on admin download endpoints.

### 6.10 Avatar URL (dicebear)
- Signup generates a dicebear avatar URL: `https://api.dicebear.com/7.x/initials/svg?seed=...`
- This is an external service; works fine in production with no changes.

### 6.11 HTTPS / mixed content
- Vercel and Fly.io both provide HTTPS automatically.
- The browser will block HTTP API calls from an HTTPS page. Ensure both are on HTTPS in production — not an issue with Vercel + Fly.io.

### 6.12 `.env` file is gitignored
- `.env` is correctly gitignored. `.env.example` is committed as a template.
- Never commit `.env` to the repo. Set all secrets through the hosting platform's secrets UI.

### 6.13 Cold starts on Fly.io free tier
- With `min_machines_running = 0` in `fly.toml`, the VM sleeps after inactivity. The next request wakes it (~2–5 seconds, faster than Render).
- Set `min_machines_running = 1` in `fly.toml` and redeploy to eliminate cold starts (uses more of the free allowance).
- The SQLite volume is **never affected** by sleep — data is always safe.

---

## 7. Pre-Deploy Checklist

### All options
- [x] `vercel.json` created at project root with SPA catch-all rewrite
- [x] `.vercelignore` created — excludes `server/` and `graphify-out/` from Vercel build
- [x] CORS updated to use `ALLOWED_ORIGINS` env var (no hardcoded localhost)
- [ ] `VITE_API_URL` set in Vercel environment variables (before first build)
- [ ] Strong `JWT_SECRET` and `CSRF_SECRET` generated

### Option A (Fly.io) specific
- [x] `Dockerfile` and `fly.toml` committed at project root
- [ ] `flyctl` installed and logged in
- [ ] App created: `fly apps create <your-name>`
- [ ] `app` field in `fly.toml` updated to match chosen name
- [ ] Volume created: `fly volumes create monetrex_data --region sin --size 1`
- [ ] Secrets set: `fly secrets set JWT_SECRET=... CSRF_SECRET=... ALLOWED_ORIGINS=...`
- [ ] `fly deploy` run successfully
- [ ] `VITE_API_URL` updated to Fly.io URL in Vercel dashboard
- [ ] Vercel frontend redeployed after `VITE_API_URL` change

### Option B (Render) specific
- [x] `render.yaml` committed at project root
- [ ] Render Web Service created and linked to GitHub repo
- [ ] `JWT_SECRET`, `CSRF_SECRET`, and `ALLOWED_ORIGINS` set in Render dashboard
- [ ] Render Persistent Disk added and `DATA_DIR=/var/data` set (otherwise data is lost on restart)
- [ ] `VITE_API_URL` updated to Render service URL in Vercel dashboard
- [ ] Vercel frontend redeployed after `VITE_API_URL` change

### Option C (Turso) specific
- [ ] Turso database created (`turso db create monetrex`)
- [ ] `TURSO_URL` and `TURSO_AUTH_TOKEN` obtained from Turso dashboard
- [ ] `better-sqlite3` removed from dependencies
- [ ] `@libsql/client` installed
- [ ] All DB calls rewritten to async/await
- [ ] DB transactions rewritten to `db.batch()`
- [ ] `api/index.js` adapter created
- [ ] `vercel.json` updated with `/api/(.*)` rewrite rule (in addition to SPA rule)

---

## Decision Summary

| | Option A (Fly.io) ⭐ | Option B (Render) | Option C (Turso) |
|---|---|---|---|
| Code changes | None (Dockerfile + fly.toml) | None | DB driver + all async rewrites |
| Platforms | 2 (Vercel + Fly.io) | 2 (Vercel + Render) | 1 (Vercel) |
| Data safety (free tier) | ✅ Volume persists across restarts | ❌ Wiped on every restart | ✅ Cloud DB |
| Monthly cost | $0 | $0 (ephemeral) | $0 |
| Cold starts | ~2–5 s | ~20–35 s | None |
| Effort | ~1–2 hours | ~30 min | ~4–6 hours |
| Recommended for | **Development + production** | Demos only | Long-term single-platform |

**Start with Option A (Fly.io).** Data won't be lost, deploy takes ~1–2 hours, no code changes needed.
