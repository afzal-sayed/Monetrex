# Graph Report - .  (2026-05-30)

## Corpus Check
- 55 files · ~46,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 245 nodes · 234 edges · 48 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]

## God Nodes (most connected - your core abstractions)
1. `useAppContext()` - 15 edges
2. `useDataSlice` - 11 edges
3. `server/index.js (Express Entry Point)` - 9 edges
4. `Option A: Vercel + Fly.io (Recommended)` - 8 edges
5. `Option B: Vercel + Render.com` - 7 edges
6. `Route: GET /api/data (all frontend state in one request)` - 7 edges
7. `DashboardLayout (Protected Shell)` - 7 edges
8. `Frontend Helpers (helpers.js)` - 6 edges
9. `icons.svg (SVG Sprite Sheet for Social/UI Icons)` - 6 edges
10. `Option C: Full Vercel + Turso` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Security Badge: bcrypt + HttpOnly Cookies` --conceptually_related_to--> `better-sqlite3 Native Module`  [INFERRED]
  auth-page.png → DEPLOY.md
- `favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient)` --semantically_similar_to--> `vite.svg (Vite Official Logo - Lightning Bolt, Purple/Cyan Gradient)`  [INFERRED] [semantically similar]
  public/favicon.svg → src/assets/vite.svg
- `hero.png (Isometric Stacked Layer Illustration)` --semantically_similar_to--> `favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient)`  [INFERRED] [semantically similar]
  src/assets/hero.png → public/favicon.svg
- `Dashboard UI (After Transaction Added)` --references--> `Monthly Overview Bar/Line Chart (6-month view)`  [EXTRACTED]
  after-transaction.png → dashboard.png
- `Dashboard UI (After Transaction Added)` --references--> `Category Split Chart`  [EXTRACTED]
  after-transaction.png → dashboard.png

## Hyperedges (group relationships)
- **Monetrex Full Tech Stack** — tech_react19_vite, tech_expressjs, tech_postgresql_supabase, tech_vercel_hosting, tech_tailwindcss, tech_recharts, tech_jwt_auth, tech_bcrypt, tech_csrf, tech_resend_email [EXTRACTED 1.00]
- **Vercel Unified Deployment (Frontend + Serverless Backend)** — file_api_index, file_server_index, file_vercel_json, deploy_vercel_unified, rationale_unified_vercel [EXTRACTED 1.00]
- **Express Backend Route Files** — file_route_auth, file_route_users, file_route_data, file_route_groups, file_route_transactions, file_route_budgets [EXTRACTED 1.00]
- **PostgreSQL Database Schema Tables** — db_table_users, db_table_groups_tbl, db_table_memberships, db_table_transactions, db_table_budgets, db_table_revoked_tokens, db_table_password_reset_tokens [EXTRACTED 1.00]
- **Frontend State Management Slices** — file_appprovider, file_useauthslice, file_usedataslice, file_useuislice, file_appcontext [EXTRACTED 1.00]
- **Required Environment Variables for Vercel** — envvar_jwt_secret, envvar_csrf_secret, envvar_database_url, envvar_allowed_origins, envvar_app_url [EXTRACTED 1.00]
- **Frontend Protected Pages** — page_dashboard, page_transactions, page_analytics, page_family, page_settings [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (19): Analytics(), AppInner(), AuthRoute(), ErrorBoundary, ProtectedRoute(), Auth(), useAppContext(), Dashboard() (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (26): Convention: Role Hierarchy Owner > Admin > Member, DB Table: budgets, DB Table: groups_tbl, DB Table: memberships, DB Table: password_reset_tokens, DB Table: revoked_tokens, Env Var: CSRF_SECRET, Env Var: JWT_SECRET (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (22): Monetrex App (CLAUDE.md), Convention: PostgreSQL $1,$2,... placeholders, Deployment: Supabase PostgreSQL Database, Env Var: APP_URL (for password reset links), Env Var: DATABASE_URL (Supabase Session Pooler URI), Env Var: PGSSL_INSECURE (local dev only), Env Var: RESEND_API_KEY (optional), Env Var: RESEND_FROM_EMAIL (optional) (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (21): Deployment Architecture Overview, better-sqlite3 Native Module, CORS ALLOWED_ORIGINS env var, Critical Blocker: better-sqlite3 on Vercel, DATA_DIR Environment Variable, Deployment Decision Summary Table, Dockerfile (multi-stage, better-sqlite3 native build), Edge Cases and Gotchas (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (19): Add Transaction Modal UI, Dashboard UI (After Transaction Added), Auth Page UI (Login Screen), Dashboard UI (Empty State), Add Expense / Income Modal, Assign To Field (group member assignment), Category Selector (Food, Dining Out, Rent, Housing, Transport, Fuel, etc.), Category Split Chart (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (14): addFamilyMember() Action, addTransaction() Action, AppProvider(), createGroup() Action, deleteTransaction() Action, leaveGroup() Action, removeFamilyMember() Action, renameGroup() Action (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.19
Nodes (7): signToken(), authenticate(), query(), run(), createDefaultGroup(), genId(), genJti()

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (6): CATEGORIES List, CATEGORY_COLORS Constant, CATEGORY_EMOJI Constant, computeInsights(), Frontend Helpers (helpers.js), InsightsPanel Component

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (8): DashboardLayout (Protected Shell), MobileNav.jsx, Sidebar.jsx, Page: /analytics (Analytics.jsx), Page: /dashboard (Dashboard.jsx), Page: /family (Family.jsx), Page: /settings (Settings.jsx), Page: /transactions (Transactions.jsx)

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (8): ErrorBoundary, ProtectedRoute (Auth Guard), App.jsx (Router Root), src/context/AppContext.jsx (Global State), AppProvider (State Composer), useAuthSlice (Auth State Slice), useDataSlice (Data State Slice), useUISlice (UI State Slice)

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (7): Bluesky Social Icon, Discord Social Icon, Documentation Icon (purple stroke), GitHub Social Icon, Social/Members Icon, icons.svg (SVG Sprite Sheet for Social/UI Icons), X (Twitter) Social Icon

### Community 11 - "Community 11"
Cohesion: 0.6
Nodes (3): Budgets(), fmt(), toLabel()

### Community 12 - "Community 12"
Cohesion: 0.4
Nodes (5): Convention: amount negative=expense, positive=income, Convention: date ISO YYYY-MM-DD, Convention: is_recurring 0/1 in DB, boolean in JS, DB Table: transactions, src/utils/helpers.js (formatDate, computeMonthlyData)

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (2): cn(), Modal()

### Community 14 - "Community 14"
Cohesion: 0.83
Nodes (3): apiFetch(), fetchCsrfToken(), getToken()

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (3): favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient), hero.png (Isometric Stacked Layer Illustration), vite.svg (Vite Official Logo - Lightning Bolt, Purple/Cyan Gradient)

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (2): Deployment: Vercel (Frontend + Backend on one domain), WHY: Single Vercel domain eliminates CORS

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): AddExpenseModal Component

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): Export Utility (export.js)

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): react.svg (React Official Logo - Atom/Electron Style, Cyan)

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): Pre-Deploy Checklist

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): bcrypt Password Hashing

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): server/helpers.js (genId, safeUser, createDefaultGroup)

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): .env.example (Environment Template)

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): DB Table: users

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): Page: /auth (Auth.jsx, public)

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): Env Var: ALLOWED_ORIGINS

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): Command: npm install

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (1): Command: npm run dev (Vite 5173 + Express 3001)

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): Command: npm run build

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (1): Command: npm run lint (ESLint)

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): Command: npm run preview

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): Command: npm run server (Express only)

## Knowledge Gaps
- **87 isolated node(s):** `AddExpenseModal Component`, `InsightsPanel Component`, `Toast Component`, `addTransaction() Action`, `updateTransaction() Action` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (2 nodes): `users.js`, `isValidEmail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `DashboardLayout()`, `DashboardLayout.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `Deployment: Vercel (Frontend + Backend on one domain)`, `WHY: Single Vercel domain eliminates CORS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `transactions.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `data.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `groups.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `budgets.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `AddExpenseModal Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `Card.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Button.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `Toggle.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `Input.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `Export Utility (export.js)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `react.svg (React Official Logo - Atom/Electron Style, Cyan)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `Pre-Deploy Checklist`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `bcrypt Password Hashing`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `server/helpers.js (genId, safeUser, createDefaultGroup)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `.env.example (Environment Template)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `DB Table: users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `Page: /auth (Auth.jsx, public)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `Env Var: ALLOWED_ORIGINS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `Command: npm install`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `Command: npm run dev (Vite 5173 + Express 3001)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `Command: npm run build`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `Command: npm run lint (ESLint)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `Command: npm run preview`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `Command: npm run server (Express only)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.