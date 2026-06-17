# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow (Required Before Any Task)

Before starting ANY feature, fix, or change:
1. Switch to master: `git checkout master`
2. Pull latest: `git pull origin master`
3. Create a relevant branch: `git checkout -b feat/<name>` or `fix/<name>` or `chore/<name>`
4. Do all work on the branch — never commit directly to master
5. If multiple independent features/fixes are needed, create one branch per feature

This rule applies to every session, even for small changes.

## Commands

```bash
npm install          # Install all deps (frontend + backend in one)
npm run dev          # Start Vite (port 5173) + Express API (port 3001) concurrently
npm run build        # Production build to /dist
npm run lint         # ESLint across .js and .jsx files
npm run preview      # Preview production build
npm run server       # Start only the backend (node server/index.js)
npm run db:backup    # Dump + encrypt Supabase DB to backups/ (requires BACKUP_ENCRYPTION_KEY in .env)
npm run db:decrypt   # Decrypt a backup file
```

Both processes must be running for the app to work. The frontend proxies `/api` → `http://localhost:3001` via Vite in dev.

## Architecture

**React 19 + Vite SPA** with an **Express + PostgreSQL (Supabase) backend**, deployed entirely on Vercel.

### Backend (`server/`)

- `server/index.js` — Express entry point; mounts route files, requires `JWT_SECRET` and `CSRF_SECRET` env vars at startup. Exported as default for Vercel serverless (`api/index.js` re-exports it).
- `server/routes/` — split by domain: `auth.js`, `users.js`, `data.js`, `groups.js`, `transactions.js`, `budgets.js`.
- `server/middleware/authenticate.js` — async JWT verification middleware, sets `req.userId`. Checks revoked token list in DB.
- `server/helpers.js` — `genId()`, `safeUser()`, `createDefaultGroup()` (all async, shared across routes).
- `server/database.js` — `pg` Pool connecting to Supabase. Exports `query(sql, params)` (returns rows array) and `run(sql, params)` (fire-and-forget). SSL enabled in production, opt-out via `PGSSL_INSECURE=1` for local dev.
- Auth: bcrypt password hashing, JWT tokens (7d expiry). Token stored client-side as `monetrex_token` in localStorage, sent as `Authorization: Bearer <token>` header.
- Key endpoint: `GET /api/data` returns groups + memberships + transactions + budgets for the authenticated user in a single request.

**Tables:** `users`, `groups_tbl`, `memberships`, `transactions`, `budgets`, `revoked_tokens`, `password_reset_tokens`, `custom_categories`

All tables are auto-created on startup via `runSchema()` in `server/database.js` — no manual SQL needed for new deployments.

### Vercel Serverless Wiring

- `api/index.js` — thin wrapper that re-exports the Express app as Vercel's serverless handler
- `vercel.json` — routes `/api/*` to `api/index.js`, all other paths to `index.html` (SPA catch-all)
- `.vercelignore` — excludes only `graphify-out/`; `server/` is included (needed by `api/index.js`)

### Frontend State (`src/context/AppContext.jsx`)

`AppProvider` composes three domain slices and owns cross-cutting actions. All API calls go through `apiFetch()` in `src/utils/api.js`, which auto-attaches the JWT header and handles 401 → logout. Context exposes:
- **Auth** (`useAuthSlice`): `user`, `authReady`, `login`, `signup`, `updateUser`, `changePassword`
- **Data** (`useDataSlice`): `groups`, `family`, `transactions`, `budgets`, `activeGroupId`, all CRUD actions
- **UI** (`useUISlice`): `theme`, `toggleTheme`, `toast`, `showToast`, `isLoading`
- **Cross-cutting** (AppProvider): `logout`, `deleteAccount`, `fetchData`, `leaveGroup`
- `monthlyData` — pre-computed 6-month chart data (memoized from transactions)

### Routing

`App.jsx` wraps all routes in `AppProvider` + `ErrorBoundary`. `ProtectedRoute` waits for `authReady` before redirecting (prevents flash-of-redirect on token refresh).

```
/auth  → Auth.jsx  (public)
/ → /dashboard → DashboardLayout (protected)
  ├── /dashboard    → Dashboard.jsx
  ├── /transactions → Transactions.jsx
  ├── /analytics    → Analytics.jsx
  ├── /budgets      → Budgets.jsx
  ├── /family       → Family.jsx
  └── /settings     → Settings.jsx
```

### Key Utilities (`src/utils/`)

- `api.js` — `apiFetch()`, `getToken()`, `API` base URL (defaults to `/api` — same origin on Vercel), `TOKEN_KEY`, `GROUP_KEY`
- `helpers.js` — `formatDate`, `computeMonthlyData`, `computeInsights`, `CATEGORIES`, `CATEGORY_COLORS`
- `export.js` — CSV (comma-separated) and JSON export with browser download

### Layout

Desktop: fixed sidebar (`Sidebar.jsx`) at `w-64`, main content `md:ml-64`.  
Mobile: sidebar hidden, bottom nav bar (`MobileNav.jsx`) fixed at bottom, main content gets `pb-20`.  
Background: `.grid-bg` CSS class applies a subtle dot-grid pattern.

### Key Conventions

- Transaction `amount`: negative = expense, positive = income.
- Transaction `date`: ISO format `YYYY-MM-DD` (stored in PostgreSQL as TEXT, formatted in UI via `formatDate`).
- `is_recurring`: integer 0/1 in DB, boolean in JS.
- SQL placeholders: PostgreSQL `$1, $2, ...` (not SQLite `?`). Arrays use `ANY($1)` pattern.
- Role hierarchy: `Owner` > `Admin` > `Member`. Admins see all transactions; members see only their own.
- `memberships.user_name` (joined from `users`) is the display name; falls back to `memberships.name`.
- Category budgets are per-group, stored in the `budgets` table with `UNIQUE(group_id, category, month)` constraint.
- Cross-page scroll: use `<Link to="/page" state={{ scrollTo: 'section-id' }}>` and in the target page add `useLocation` + `useEffect` to `getElementById('section-id').scrollIntoView()`. Currently wired: Dashboard → Settings#budget-goals, Budgets → Settings#budget-goals.
- `Button` variants: `primary` (gradient purple), `secondary` (emerald), `glass` (translucent), `ghost` (text-only). No `outline` variant — using an undefined variant silently renders unstyled.

## Deployment

Everything deploys to **Vercel** (frontend + backend as serverless function). Database is **Supabase** (PostgreSQL, free tier).

### Required Environment Variables (set in Vercel dashboard)

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Token signing secret |
| `CSRF_SECRET` | CSRF double-submit cookie secret |
| `DATABASE_URL` | Supabase Session Pooler URI (port 5432) |
| `ALLOWED_ORIGINS` | Your Vercel deployment URL (e.g. `https://monetrex.vercel.app`) |
| `APP_URL` | Same as above — used in password reset email links |

### Local Development

Copy `.env.example` to `.env` and fill in:

```bash
JWT_SECRET=<any-random-string>
CSRF_SECRET=<any-random-string>
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
PGSSL_INSECURE=1   # needed locally if Supabase pooler cert isn't trusted by your OS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
NODE_ENV=development
```

Get `DATABASE_URL` from: Supabase → Settings → Database → **Connection pooling → Session mode (port 5432)**.

### Supabase Schema

Run once in Supabase SQL Editor to create all tables (see README.md for the full SQL).

## Knowledge Graph (RAG)

A pre-built knowledge graph of this codebase lives in `graphify-out/`. **Before reading source files to answer architecture or tracing questions, query the graph first.**

- `graphify-out/graph.json` — full graph (202 nodes, 138 edges, 97 communities)
- `graphify-out/GRAPH_REPORT.md` — community map, god nodes, surprising connections
- `graphify-out/graph.html` — interactive visualization (open in browser)

### Key god nodes (highest connectivity — start here for broad questions)
- `Architecture Overview` — 8 edges, entry point for stack-level questions (React 19 + Vite + Express + Supabase + Vercel)
- `DB Backup Design Spec` / `DB Backup Implementation Plan` — 7–8 edges, covers backup strategy, encryption, restore flow
- `Set Budget Limit Modal` — 8 edges, bridges Budgets page, AppContext, Modal component, and Settings scroll flow
- `helpers.js` — 5 edges, shared formatting and compute utilities

### How to use it

**Run `/graphify query "<question>"` to traverse the graph** for any architecture question before reading source files directly. Update the graph after significant code changes with `/graphify . --update`.
