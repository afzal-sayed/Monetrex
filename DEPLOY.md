# Monetrex — Vercel Deployment Plan

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [The Critical Blocker](#2-the-critical-blocker)
3. [Option A — Vercel + Railway (Recommended)](#3-option-a--vercel--railway-recommended)
4. [Option B — Full Vercel + Turso](#4-option-b--full-vercel--turso)
5. [Edge Cases & Gotchas](#5-edge-cases--gotchas)
6. [Pre-Deploy Checklist](#6-pre-deploy-checklist)

---

## 1. Architecture Overview

| Layer | Current (dev) | Option A (prod) | Option B (prod) |
|---|---|---|---|
| Frontend | `localhost:5173` (Vite) | Vercel CDN | Vercel CDN |
| API | `localhost:3001` (Express) | Railway (Node) | Vercel Serverless Functions |
| Database | `server/data/monetrex.db` (SQLite file) | SQLite on Railway volume | Turso (cloud SQLite) |

The frontend calls the API via `VITE_API_URL` — this env var is the only hardcoded coupling between the two layers. Both options keep that contract.

---

## 2. The Critical Blocker

**`better-sqlite3` cannot run on Vercel serverless.**

Vercel runs API routes as AWS Lambda functions. Two problems:

1. **Native module**: `better-sqlite3` uses C++ bindings (node-gyp). Vercel's build environment cannot compile native modules. The build will fail with a node-gyp/prebuild error.

2. **Ephemeral filesystem**: Even if it compiled, Lambda functions have no persistent disk. Every cold start would start with an empty `monetrex.db`, losing all user data.

This means **you cannot deploy the Express server as-is to Vercel**. You have two paths:

- **Option A** — Keep the Express + SQLite stack, host backend on Railway (persistent VM, not serverless). Only the frontend goes to Vercel.
- **Option B** — Rewrite the backend to Vercel serverless functions and swap `better-sqlite3` for `@libsql/client` (Turso — a cloud SQLite with pure-JS driver).

---

## 3. Option A — Vercel + Railway (Recommended)

**Effort: Low. No database migration. No query rewrites.**

### How it works

```
Browser → Vercel CDN (React SPA)
             ↓ API calls
         Railway (Express + SQLite on persistent disk)
```

The Vercel-hosted frontend talks to the Railway-hosted backend via `VITE_API_URL`. CORS is updated to allow the Vercel domain.

### 3.1 Code changes — ✅ already implemented

#### `server/index.js` — CORS uses `ALLOWED_ORIGINS` env var ✅
CORS no longer hardcodes localhost. It reads `ALLOWED_ORIGINS` from the environment, falling back to localhost for local dev:
```js
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
```
Set `ALLOWED_ORIGINS=https://your-app.vercel.app` on Railway.

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

### 3.2 Vercel setup (frontend)

1. Push code to GitHub.
2. Import repo in Vercel dashboard.
3. Vercel auto-detects Vite — no framework config needed.
4. Set **Environment Variables** in Vercel project settings:
   ```
   VITE_API_URL = https://your-backend.railway.app/api
   ```
   > `VITE_` prefix required — Vite only exposes variables with this prefix to browser code.
5. Deploy. Build command: `npm run build`. Output dir: `dist`.

### 3.3 Railway setup (backend)

1. Create a Railway project → **Deploy from GitHub repo**.
2. Set **Start Command**: `node server/index.js`
3. Set **Environment Variables** on Railway:
   ```
   JWT_SECRET   = <generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
   ALLOWED_ORIGINS = https://your-app.vercel.app
   NODE_ENV     = production
   PORT         = 3001   # Railway sets $PORT automatically; this is a fallback
   ```
4. **Persistent volume** — critical for SQLite:
   - In Railway project → Storage → Add Volume → mount at `/app/server/data`
   - Without this, `monetrex.db` is wiped on every redeploy.
   - Railway free tier: ephemeral disk (data lost on restart). **Upgrade to Hobby ($5/mo) for a volume.**

### 3.4 Free-tier note (Render as alternative)

Render.com also hosts Node.js apps free. Caveat: free tier **spins down after 15 minutes of inactivity**, causing a ~30 second cold start on the next request — very noticeable for users. Railway's free tier doesn't spin down but has a monthly usage cap. Railway Hobby ($5/mo) is the most practical choice for persistent + always-on.

---

## 4. Option B — Full Vercel + Turso

**Effort: Medium. Requires replacing the database driver and rewriting all DB calls from sync to async. All SQL queries stay the same.**

### How it works

```
Browser → Vercel CDN (React SPA)
             ↓ API calls (same-origin, /api/*)
         Vercel Serverless Functions (Express adapted via @vercel/node or raw handlers)
             ↓
         Turso (cloud SQLite, pure-JS @libsql/client)
```

### 4.1 Why Turso works where better-sqlite3 doesn't

Turso is a hosted fork of SQLite (libSQL). Its JS client `@libsql/client` is **pure JavaScript** (no native bindings), so it builds fine on Vercel. It speaks a superset of SQLite SQL, so all existing queries run unchanged. The only difference: the API is async (`await db.execute(...)`) instead of synchronous.

### 4.2 Code changes required

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

### 4.3 Turso free tier limits

| Resource | Free limit |
|---|---|
| Storage | 500 MB |
| Row reads | 1 billion / month |
| Row writes | 25 million / month |
| Databases | 3 |

More than enough for a personal/small-team expense app.

---

## 5. Edge Cases & Gotchas

### 5.1 CORS ✅ fixed
- ~~Hardcoded `['http://localhost:5173', 'http://localhost:4173']`~~ — now reads from `ALLOWED_ORIGINS` env var.
- Still requires setting `ALLOWED_ORIGINS=https://your-app.vercel.app` on Railway before the first backend deploy.
- Add both the Vercel URL and any custom domain as a comma-separated list if needed.

### 5.2 `VITE_API_URL` build-time baking
- Vite bakes env vars into the JS bundle at **build time**, not runtime.
- You must set `VITE_API_URL` in Vercel's **project settings → Environment Variables** *before* triggering a build.
- Changing it after a build requires a redeploy.
- Symptom if missing: the frontend falls back to `http://localhost:3001/api` (hardcoded in `src/utils/api.js`), all API calls fail silently in production.

### 5.3 SPA routing (404 on refresh) ✅ fixed
- `vercel.json` is committed with the catch-all rewrite rule.
- React Router only handles routing *after* `index.html` is loaded. The CDN must always serve `index.html` for non-asset paths — this is now handled.

### 5.4 JWT secret rotation
- All existing tokens are signed with `JWT_SECRET`. Changing the secret in production invalidates every active session — all users are logged out simultaneously.
- Plan: only rotate the secret intentionally (security incident), not casually.

### 5.5 SQLite WAL mode on Railway
- `db.pragma('journal_mode = WAL')` works fine on Railway's persistent volume.
- If using a Docker-based Railway setup, ensure the volume is mounted before the app starts. WAL creates sibling files (`monetrex.db-shm`, `monetrex.db-wal`) — the volume must cover the entire `server/data/` directory.

### 5.6 `better-sqlite3` build failure on Vercel ✅ fixed
- `.vercelignore` is committed, excluding `server/` and `graphify-out/` from Vercel's build context.
- Vercel will not see `better-sqlite3` in its dependency tree and will not attempt to compile it.
- No changes to `package.json` or install commands needed.

### 5.7 Database migration (first deploy)
- The schema uses `CREATE TABLE IF NOT EXISTS` — idempotent, safe to run on every cold start.
- No separate migration runner needed for initial deploy.
- Future schema changes need a migration strategy (ALTER TABLE or versioned migration files).

### 5.8 Free-tier data loss (Railway without persistent volume)
- Railway's free tier does not include persistent volumes. If the app restarts (deploy, crash, or weekly maintenance), `monetrex.db` is wiped.
- **Do not use the free tier for a production database.** Railway Hobby ($5/mo) includes volumes.

### 5.9 `bcryptjs` vs `bcrypt`
- Already using `bcryptjs` (pure JavaScript). No native module issues. No action needed.

### 5.10 No rate limiting on auth endpoints
- `POST /api/auth/signup` and `POST /api/auth/login` have no rate limiting.
- In production, a basic rate limiter (e.g. `express-rate-limit`) on auth routes is strongly recommended to prevent brute-force attacks.
- Not a blocker for deployment, but a known gap.

### 5.11 Avatar URL (dicebear)
- Signup generates a dicebear avatar URL: `https://api.dicebear.com/7.x/initials/svg?seed=...`
- This is an external service; works fine in production with no changes.

### 5.12 HTTPS / mixed content
- Vercel and Railway both provide HTTPS automatically.
- The browser will block HTTP API calls from an HTTPS page. Ensure both are on HTTPS in production — not an issue with Vercel and Railway.

### 5.13 `.env` file is gitignored
- `.env` is correctly gitignored. `.env.example` is committed as a template.
- Never commit `.env` to the repo. Set all secrets through the hosting platform's env var UI.

---

## 6. Pre-Deploy Checklist

### Both options
- [x] `vercel.json` created at project root with SPA catch-all rewrite
- [x] `.vercelignore` created — excludes `server/` and `graphify-out/` from Vercel build
- [x] CORS updated to use `ALLOWED_ORIGINS` env var (no hardcoded localhost)
- [ ] `VITE_API_URL` set in Vercel environment variables (before first build)
- [ ] Strong `JWT_SECRET` generated (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

### Option A specific
- [x] Code changes done (CORS, vercel.json, .vercelignore)
- [ ] Railway project created, linked to repo
- [ ] `node server/index.js` set as start command on Railway
- [ ] `JWT_SECRET` and `ALLOWED_ORIGINS` set on Railway
- [ ] Railway volume mounted at `/app/server/data` (Hobby plan required)

### Option B specific
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

| | Option A (Vercel + Railway) | Option B (Full Vercel + Turso) |
|---|---|---|
| Code changes | CORS + vercel.json | DB driver + all async rewrites |
| Platforms | 2 (Vercel + Railway) | 1 (Vercel) |
| Free tier viability | Limited (no persistent disk) | Yes (Turso free tier) |
| Monthly cost | $0 (ephemeral) or $5 (persistent) | $0 |
| SQL compatibility | 100% unchanged | 100% unchanged (libSQL) |
| Effort | ~1 hour | ~4–6 hours |
| Recommended for | Quick launch, keep SQLite | Long-term, single platform |

**Start with Option A.** Get the app live in ~1 hour. Migrate to Option B later if you want a single-platform setup.
