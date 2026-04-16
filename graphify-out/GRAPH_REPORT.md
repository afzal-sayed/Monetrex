# Graph Report - .  (2026-04-16)

## Corpus Check
- 43 files · ~15,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 183 nodes · 185 edges · 42 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Docs & API Architecture|Docs & API Architecture]]
- [[_COMMUNITY_App Pages & Analytics|App Pages & Analytics]]
- [[_COMMUNITY_Deployment Plan|Deployment Plan]]
- [[_COMMUNITY_Project Setup & README|Project Setup & README]]
- [[_COMMUNITY_Routing & Pages Docs|Routing & Pages Docs]]
- [[_COMMUNITY_Backend API & DB Docs|Backend API & DB Docs]]
- [[_COMMUNITY_Context Slices|Context Slices]]
- [[_COMMUNITY_Data Utilities|Data Utilities]]
- [[_COMMUNITY_Social Icons|Social Icons]]
- [[_COMMUNITY_Error Boundary|Error Boundary]]
- [[_COMMUNITY_Add Expense Modal|Add Expense Modal]]
- [[_COMMUNITY_Export Utilities|Export Utilities]]
- [[_COMMUNITY_UI Utilities|UI Utilities]]
- [[_COMMUNITY_Server Helpers|Server Helpers]]
- [[_COMMUNITY_Visual Assets|Visual Assets]]
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

## God Nodes (most connected - your core abstractions)
1. `useAppContext()` - 15 edges
2. `Express + SQLite Backend` - 11 edges
3. `DashboardLayout — Protected Shell` - 9 edges
4. `AppContext.jsx — Central Frontend State` - 8 edges
5. `Application Architecture Overview` - 8 edges
6. `DEPLOY.md — Vercel Deployment Plan` - 8 edges
7. `Option A: Vercel + Railway (Recommended)` - 7 edges
8. `icons.svg (SVG Sprite Sheet for Social/UI Icons)` - 6 edges
9. `ErrorBoundary` - 5 edges
10. `server/database.js — SQLite Schema (better-sqlite3)` - 5 edges

## Surprising Connections (you probably didn't know these)
- `favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient)` --semantically_similar_to--> `vite.svg (Vite Official Logo - Lightning Bolt, Purple/Cyan Gradient)`  [INFERRED] [semantically similar]
  public/favicon.svg → src/assets/vite.svg
- `favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient)` --semantically_similar_to--> `hero.png (Isometric Stacked Layer Illustration)`  [INFERRED] [semantically similar]
  public/favicon.svg → src/assets/hero.png
- `server/database.js — SQLite Schema (better-sqlite3)` --conceptually_related_to--> `Turso — Cloud SQLite with @libsql/client`  [INFERRED]
  CLAUDE.md → DEPLOY.md
- `server/database.js — SQLite Schema (better-sqlite3)` --conceptually_related_to--> `Sync→Async DB Migration (better-sqlite3 → libsql)`  [INFERRED]
  CLAUDE.md → DEPLOY.md
- `React 19 + Vite SPA Frontend` --conceptually_related_to--> `React + Vite Template (README)`  [INFERRED]
  CLAUDE.md → README.md

## Hyperedges (group relationships)
- **JWT Authentication Flow: Auth Page, apiFetch, Protected Route** — claudemd_auth_page, claudemd_apifetch, claudemd_protected_route, claudemd_auth_jwt [INFERRED 0.90]
- **Responsive Navigation Pattern: DashboardLayout, Sidebar, MobileNav** — claudemd_dashboard_layout, claudemd_sidebar, claudemd_mobilenav [EXTRACTED 0.95]
- **Transaction Data Pipeline: DB Tables, API Endpoint, AppContext, helpers.js** — claudemd_db_tables, claudemd_api_data_endpoint, claudemd_appcontext, claudemd_helpers_js, claudemd_monthly_data [INFERRED 0.85]

## Communities

### Community 0 - "Docs & API Architecture"
Cohesion: 0.08
Nodes (29): src/utils/api.js — apiFetch, getToken, API base URL, apiFetch() — JWT-attached API Utility, App.jsx (Router Root), AppContext.jsx — Central Frontend State, App.jsx — Root Router with AppProvider + ErrorBoundary, Application Architecture Overview, JWT Auth (bcrypt + 7d token), Auth.jsx Page (Public) (+21 more)

### Community 1 - "App Pages & Analytics"
Cohesion: 0.08
Nodes (13): Analytics(), AppInner(), AuthRoute(), ProtectedRoute(), Auth(), Dashboard(), Family(), BudgetSection() (+5 more)

### Community 2 - "Deployment Plan"
Cohesion: 0.15
Nodes (19): Deployment Overview (Vercel + Railway), server/database.js — SQLite Schema (better-sqlite3), server/index.js — Express Entry Point, server/data/monetrex.db (SQLite File), Architecture Table: Dev vs Prod Options, Sync→Async DB Migration (better-sqlite3 → libsql), Pre-Deploy Checklist, CORS Fix — ALLOWED_ORIGINS env var (+11 more)

### Community 3 - "Project Setup & README"
Cohesion: 0.24
Nodes (10): CLAUDE.md Project Guidance, React 19 + Vite SPA Frontend, TypeScript + typescript-eslint Recommendation, @vitejs/plugin-react (Oxc-based), @vitejs/plugin-react-swc (SWC-based), Rationale: React Compiler disabled due to dev/build performance impact, React Compiler (not enabled by default), README — React + Vite Template (+2 more)

### Community 4 - "Routing & Pages Docs"
Cohesion: 0.25
Nodes (9): Analytics.jsx Page, DashboardLayout — Protected Shell, Dashboard.jsx Page, Family.jsx Page, .grid-bg CSS Pattern (Dot-Grid Background), MobileNav.jsx (Mobile Bottom Nav), Role Hierarchy: Owner > Admin > Member, Sidebar.jsx (Desktop Fixed Nav) (+1 more)

### Community 5 - "Backend API & DB Docs"
Cohesion: 0.25
Nodes (9): GET /api/data — Aggregate Data Endpoint, Express + SQLite Backend, DB Tables: users, groups_tbl, memberships, transactions, budgets, Rationale: Single GET /api/data endpoint for all user data, Rationale: Replaced json-server + db.json with Express + SQLite, server/helpers.js — genId / safeUser / createDefaultGroup, server/middleware/authenticate.js — JWT Middleware, server/routes/ — Domain Route Files (+1 more)

### Community 6 - "Context Slices"
Cohesion: 0.25
Nodes (4): AppProvider(), useAuthSlice(), useDataSlice(), useUISlice()

### Community 7 - "Data Utilities"
Cohesion: 0.29
Nodes (2): computeInsights(), InsightsPanel()

### Community 8 - "Social Icons"
Cohesion: 0.33
Nodes (7): Bluesky Social Icon, Discord Social Icon, Documentation Icon (purple stroke), GitHub Social Icon, Social/Members Icon, icons.svg (SVG Sprite Sheet for Social/UI Icons), X (Twitter) Social Icon

### Community 9 - "Error Boundary"
Cohesion: 0.4
Nodes (1): ErrorBoundary

### Community 10 - "Add Expense Modal"
Cohesion: 0.83
Nodes (3): AddExpenseModal(), emptyForm(), today()

### Community 11 - "Export Utilities"
Cohesion: 0.83
Nodes (3): downloadBlob(), exportToCSV(), exportToJSON()

### Community 12 - "UI Utilities"
Cohesion: 0.5
Nodes (2): cn(), Modal()

### Community 13 - "Server Helpers"
Cohesion: 0.67
Nodes (2): createDefaultGroup(), genId()

### Community 14 - "Visual Assets"
Cohesion: 0.67
Nodes (3): favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient), hero.png (Isometric Stacked Layer Illustration), vite.svg (Vite Official Logo - Lightning Bolt, Purple/Cyan Gradient)

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (2): apiFetch(), getToken()

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

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
Nodes (0): 

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
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): export.js Utility (CSV + JSON Download)

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): react.svg (React Official Logo - Atom/Electron Style, Cyan)

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **38 isolated node(s):** `server/data/monetrex.db (SQLite File)`, `ErrorBoundary`, `Dashboard.jsx Page`, `Analytics.jsx Page`, `Family.jsx Page` (+33 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (2 nodes): `Toast.jsx`, `Toast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `DashboardLayout()`, `DashboardLayout.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `MobileNav()`, `MobileNav.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `authenticate()`, `authenticate.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `database.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `genId()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `safeUser()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `authenticate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `Card.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `Button.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Toggle.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `Input.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `getToken()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `apiFetch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `export.js Utility (CSV + JSON Download)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `react.svg (React Official Logo - Atom/Electron Style, Cyan)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `users.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `transactions.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `data.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `groups.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `auth.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `budgets.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Application Architecture Overview` connect `Docs & API Architecture` to `Project Setup & README`, `Backend API & DB Docs`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `Express + SQLite Backend` connect `Backend API & DB Docs` to `Docs & API Architecture`, `Deployment Plan`, `Project Setup & README`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `useAppContext()` connect `App Pages & Analytics` to `Add Expense Modal`, `Data Utilities`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `useAppContext()` (e.g. with `ProtectedRoute()` and `AuthRoute()`) actually correct?**
  _`useAppContext()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `server/data/monetrex.db (SQLite File)`, `ErrorBoundary`, `Dashboard.jsx Page` to the rest of the system?**
  _38 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Docs & API Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `App Pages & Analytics` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._