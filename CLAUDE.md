# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install all deps (frontend + backend in one)
npm run dev          # Start Vite (port 5173) + Express API (port 3001) concurrently
npm run build        # Production build to /dist
npm run lint         # ESLint across .js and .jsx files
npm run preview      # Preview production build
npm run server       # Start only the backend (node server/index.js)
```

Both processes must be running for the app to work. The frontend talks to `http://localhost:3001/api`.

## Architecture

**React 19 + Vite SPA** with a **Express + SQLite backend** (replaced the old json-server + db.json).

### Backend (`server/`)

- `server/index.js` — Express entry point; mounts route files, requires `JWT_SECRET` env var at startup.
- `server/routes/` — split by domain: `auth.js`, `users.js`, `data.js`, `groups.js`, `transactions.js`, `budgets.js`.
- `server/middleware/authenticate.js` — JWT verification middleware, sets `req.userId`.
- `server/helpers.js` — `genId()`, `safeUser()`, `createDefaultGroup()` (shared across routes).
- `server/database.js` — SQLite schema via `better-sqlite3`. DB file written to `server/data/monetrex.db` (auto-created).
- Auth: bcrypt password hashing, JWT tokens (7d expiry). Token stored client-side as `monetrex_token` in localStorage.
- All protected routes require `Authorization: Bearer <token>` header.
- Key endpoint: `GET /api/data` returns groups + memberships + transactions + budgets for the authenticated user in a single request.

**Tables:** `users`, `groups_tbl`, `memberships`, `transactions`, `budgets`

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
  ├── /family       → Family.jsx
  └── /settings     → Settings.jsx
```

### Key Utilities (`src/utils/`)

- `api.js` — `apiFetch()`, `getToken()`, `API` base URL (reads `VITE_API_URL` env var), `TOKEN_KEY`, `GROUP_KEY`
- `helpers.js` — `formatDate`, `computeMonthlyData`, `computeInsights`, `CATEGORIES`, `CATEGORY_COLORS`
- `export.js` — CSV (comma-separated) and JSON export with browser download

### Layout

Desktop: fixed sidebar (`Sidebar.jsx`) at `w-64`, main content `md:ml-64`.  
Mobile: sidebar hidden, bottom nav bar (`MobileNav.jsx`) fixed at bottom, main content gets `pb-20`.  
Background: `.grid-bg` CSS class applies a subtle dot-grid pattern.

### Key Conventions

- Transaction `amount`: negative = expense, positive = income.
- Transaction `date`: ISO format `YYYY-MM-DD` (stored in SQLite, formatted in UI via `formatDate`).
- `is_recurring`: integer 0/1 in DB, boolean in JS.
- Role hierarchy: `Owner` > `Admin` > `Member`. Admins see all transactions; members see only their own.
- `memberships.user_name` (joined from `users`) is the display name; falls back to `memberships.name`.
- Category budgets are per-group, stored in the `budgets` table, accessible via `Settings → Budget Goals`.

## Deployment

Full deployment plan is in `DEPLOY.md`. Key files committed to the repo:

- `vercel.json` — catch-all SPA rewrite so React Router works on Vercel (prevents 404 on refresh)
- `.vercelignore` — excludes `server/` and `graphify-out/` from Vercel's build context so `better-sqlite3` (native module) is never compiled by Vercel
- `.env.example` — template for all required env vars

**Production split:** Frontend → Vercel, Backend → Railway (Express + SQLite cannot run on Vercel serverless).

Required env vars:

| Where | Variable | Purpose |
|---|---|---|
| Vercel | `VITE_API_URL` | Railway backend URL — set **before** first build |
| Railway | `JWT_SECRET` | Token signing secret |
| Railway | `ALLOWED_ORIGINS` | Vercel frontend URL for CORS |

## Knowledge Graph (RAG)

A pre-built knowledge graph of this codebase lives in `graphify-out/`. **Before reading source files to answer architecture or tracing questions, query the graph first.**

- `graphify-out/graph.json` — full graph (183 nodes, 185 edges, 42 communities)
- `graphify-out/GRAPH_REPORT.md` — community map, god nodes, surprising connections
- `graphify-out/graph.html` — interactive visualization (open in browser)

### How to use it

**For "where is X?" or "how does X work?" questions**, load `graph.json` and BFS from the matching node:

```bash
python3 -c "
import json
from networkx.readwrite import json_graph
import networkx as nx
from pathlib import Path

G = json_graph.node_link_graph(json.loads(Path('graphify-out/graph.json').read_text()), edges='links')
term = 'TERM'  # replace with concept to look up
matches = sorted(G.nodes(data=True), key=lambda x: sum(1 for w in term.lower().split() if w in x[1].get('label','').lower()), reverse=True)
start = matches[0][0]
neighbors = list(nx.bfs_tree(G, start, depth_limit=2).nodes())
for n in neighbors:
    d = G.nodes[n]
    print(d.get('label', n), '->', d.get('source_file',''))
"
```

**Key god nodes** (highest connectivity — start here for broad questions):
- `useAppContext()` — 15 edges, bridges all pages, auth, modals, and data utilities
- `DashboardLayout` — 8 edges, central shell for all protected routes
- `Express + SQLite Backend` — 6 edges, bridges API docs and architecture
- `AppProvider()` — 4 edges, composes auth/data/UI slices and cross-cutting actions
- `GET /api/data` — 4 edges, single endpoint serving all frontend state

**Run `/graphify query "<question>"` to traverse the graph** for any architecture question before reading source files directly. Update the graph after significant code changes with `/graphify . --update`.
