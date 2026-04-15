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

- `server/index.js` — Express app with all routes inline. No separate route files.
- `server/database.js` — SQLite schema via `better-sqlite3`. DB file written to `server/data/monetrex.db` (auto-created).
- Auth: bcrypt password hashing, JWT tokens (7d expiry). Token stored client-side as `monetrex_token` in localStorage.
- All protected routes require `Authorization: Bearer <token>` header.
- Key endpoint: `GET /api/data` returns groups + memberships + transactions + budgets for the authenticated user in a single request.

**Tables:** `users`, `groups_tbl`, `memberships`, `transactions`, `budgets`

### Frontend State (`src/context/AppContext.jsx`)

Central state via a single `AppProvider`. All API calls go through `apiFetch()` which auto-attaches the JWT header and handles 401 → logout. Context exposes:
- `login`, `signup`, `logout`, `updateUser`, `changePassword`, `deleteAccount`
- `groups`, `family` (members of active group), `transactions` (filtered by role)
- `budgets` (category → amount map for active group), `updateBudgets`
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
