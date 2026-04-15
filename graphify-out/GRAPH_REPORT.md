# Graph Report - .  (2026-04-16)

## Corpus Check
- Corpus is ~28,873 words - fits in a single context window. You may not need a graph.

## Summary
- 146 nodes · 126 edges · 42 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Analytics Analytics|Analytics Analytics]]
- [[_COMMUNITY_Claudemd Api Data Endpoint|Claudemd Api Data Endpoint]]
- [[_COMMUNITY_Claudemd Analytics Page|Claudemd Analytics Page]]
- [[_COMMUNITY_Claudemd Project|Claudemd Project]]
- [[_COMMUNITY_Appcontext Appprovider|Appcontext Appprovider]]
- [[_COMMUNITY_Helpers Computeinsights|Helpers Computeinsights]]
- [[_COMMUNITY_Icons Bluesky|Icons Bluesky]]
- [[_COMMUNITY_App Errorboundary|App Errorboundary]]
- [[_COMMUNITY_Addexpensemodal Addexpensemodal|Addexpensemodal Addexpensemodal]]
- [[_COMMUNITY_Cn Cn|Cn Cn]]
- [[_COMMUNITY_Family Family|Family Family]]
- [[_COMMUNITY_Export Downloadblob|Export Downloadblob]]
- [[_COMMUNITY_Helpers Createdefaultgroup|Helpers Createdefaultgroup]]
- [[_COMMUNITY_Favicon Svg|Favicon Svg]]
- [[_COMMUNITY_Api Apifetch|Api Apifetch]]
- [[_COMMUNITY_Src Components Ui Toast Jsx|Src Components Ui Toast Jsx]]
- [[_COMMUNITY_Dashboardlayout Dashboardlayout|Dashboardlayout Dashboardlayout]]
- [[_COMMUNITY_Mobilenav Mobilenav|Mobilenav Mobilenav]]
- [[_COMMUNITY_Authenticate Authenticate|Authenticate Authenticate]]
- [[_COMMUNITY_Eslint Config Js|Eslint Config Js]]
- [[_COMMUNITY_Vite Config Js|Vite Config Js]]
- [[_COMMUNITY_Server Database Js|Server Database Js]]
- [[_COMMUNITY_Server Index Js|Server Index Js]]
- [[_COMMUNITY_Index Genid|Index Genid]]
- [[_COMMUNITY_Index Safeuser|Index Safeuser]]
- [[_COMMUNITY_Index Authenticate|Index Authenticate]]
- [[_COMMUNITY_Src Main Jsx|Src Main Jsx]]
- [[_COMMUNITY_Src Data Mockdata Js|Src Data Mockdata Js]]
- [[_COMMUNITY_Src Components Ui Card Jsx|Src Components Ui Card Jsx]]
- [[_COMMUNITY_Src Components Ui Button Jsx|Src Components Ui Button Jsx]]
- [[_COMMUNITY_Src Components Ui Toggle Jsx|Src Components Ui Toggle Jsx]]
- [[_COMMUNITY_Src Components Ui Input Jsx|Src Components Ui Input Jsx]]
- [[_COMMUNITY_Appcontext Gettoken|Appcontext Gettoken]]
- [[_COMMUNITY_Appcontext Apifetch|Appcontext Apifetch]]
- [[_COMMUNITY_Claudemd Export Js|Claudemd Export Js]]
- [[_COMMUNITY_React Svg|React Svg]]
- [[_COMMUNITY_Server Routes Users Js|Server Routes Users Js]]
- [[_COMMUNITY_Server Routes Transactions Js|Server Routes Transactions Js]]
- [[_COMMUNITY_Server Routes Data Js|Server Routes Data Js]]
- [[_COMMUNITY_Server Routes Groups Js|Server Routes Groups Js]]
- [[_COMMUNITY_Server Routes Auth Js|Server Routes Auth Js]]
- [[_COMMUNITY_Server Routes Budgets Js|Server Routes Budgets Js]]

## God Nodes (most connected - your core abstractions)
1. `useAppContext()` - 15 edges
2. `DashboardLayout (Protected Shell)` - 8 edges
3. `Express + SQLite Backend` - 6 edges
4. `icons.svg (SVG Sprite Sheet for Social/UI Icons)` - 6 edges
5. `ErrorBoundary` - 5 edges
6. `React + Vite Template (README)` - 5 edges
7. `AppProvider()` - 4 edges
8. `GET /api/data Endpoint` - 4 edges
9. `AppContext.jsx (Central State)` - 4 edges
10. `App.jsx (Router Root)` - 4 edges

## Surprising Connections (you probably didn't know these)
- `favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient)` --semantically_similar_to--> `vite.svg (Vite Official Logo - Lightning Bolt, Purple/Cyan Gradient)`  [INFERRED] [semantically similar]
  public/favicon.svg → src/assets/vite.svg
- `hero.png (Isometric Stacked Layer Illustration)` --semantically_similar_to--> `favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient)`  [INFERRED] [semantically similar]
  src/assets/hero.png → public/favicon.svg
- `React 19 + Vite SPA Frontend` --conceptually_related_to--> `React + Vite Template (README)`  [INFERRED]
  CLAUDE.md → README.md
- `ProtectedRoute()` --calls--> `useAppContext()`  [INFERRED]
  src/App.jsx → src/context/useAppContext.js
- `AuthRoute()` --calls--> `useAppContext()`  [INFERRED]
  src/App.jsx → src/context/useAppContext.js

## Hyperedges (group relationships)
- **JWT Authentication Flow: Auth Page, apiFetch, Protected Route** — claudemd_auth_page, claudemd_apifetch, claudemd_protected_route, claudemd_auth_jwt [INFERRED 0.90]
- **Responsive Navigation Pattern: DashboardLayout, Sidebar, MobileNav** — claudemd_dashboard_layout, claudemd_sidebar, claudemd_mobilenav [EXTRACTED 0.95]
- **Transaction Data Pipeline: DB Tables, API Endpoint, AppContext, helpers.js** — claudemd_db_tables, claudemd_api_data_endpoint, claudemd_appcontext, claudemd_helpers_js, claudemd_monthly_data [INFERRED 0.85]

## Communities

### Community 0 - "Analytics Analytics"
Cohesion: 0.5
Nodes (12): Analytics(), AppInner(), AuthRoute(), ProtectedRoute(), Auth(), Dashboard(), BudgetSection(), PasswordSection() (+4 more)

### Community 1 - "Claudemd Api Data Endpoint"
Cohesion: 0.5
Nodes (16): GET /api/data Endpoint, apiFetch() (JWT-aware API client), App.jsx (Router Root), AppContext.jsx (Central State), JWT Auth (bcrypt + 7d token), Auth.jsx Page (Public), Express + SQLite Backend, ErrorBoundary (+8 more)

### Community 2 - "Claudemd Analytics Page"
Cohesion: 0.5
Nodes (14): Analytics.jsx Page, Category Budgets (Per-Group, budgets table), DashboardLayout (Protected Shell), Dashboard.jsx Page, DB Tables: users, groups_tbl, memberships, transactions, budgets, Family.jsx Page, .grid-bg CSS Pattern (Dot-Grid Background), helpers.js Utility (formatDate, computeMonthlyData, computeInsights, CATEGORIES) (+6 more)

### Community 3 - "Claudemd Project"
Cohesion: 0.5
Nodes (8): CLAUDE.md Project Guidance, React 19 + Vite SPA Frontend, @vitejs/plugin-react (Oxc-based), @vitejs/plugin-react-swc (SWC-based), Rationale: React Compiler disabled due to dev/build performance impact, React Compiler (not enabled by default), React + Vite Template (README), TypeScript + typescript-eslint (Recommended for Production)

### Community 4 - "Appcontext Appprovider"
Cohesion: 0.5
Nodes (4): AppProvider(), useAuthSlice(), useDataSlice(), useUISlice()

### Community 5 - "Helpers Computeinsights"
Cohesion: 0.5
Nodes (2): computeInsights(), InsightsPanel()

### Community 6 - "Icons Bluesky"
Cohesion: 0.5
Nodes (7): Bluesky Social Icon, Discord Social Icon, Documentation Icon (purple stroke), GitHub Social Icon, Social/Members Icon, icons.svg (SVG Sprite Sheet for Social/UI Icons), X (Twitter) Social Icon

### Community 7 - "App Errorboundary"
Cohesion: 0.5
Nodes (1): ErrorBoundary

### Community 8 - "Addexpensemodal Addexpensemodal"
Cohesion: 0.5
Nodes (3): AddExpenseModal(), emptyForm(), today()

### Community 9 - "Cn Cn"
Cohesion: 0.5
Nodes (2): cn(), Modal()

### Community 10 - "Family Family"
Cohesion: 0.5
Nodes (1): Family()

### Community 11 - "Export Downloadblob"
Cohesion: 0.5
Nodes (3): downloadBlob(), exportToCSV(), exportToJSON()

### Community 12 - "Helpers Createdefaultgroup"
Cohesion: 0.5
Nodes (2): createDefaultGroup(), genId()

### Community 13 - "Favicon Svg"
Cohesion: 0.5
Nodes (3): favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient), hero.png (Isometric Stacked Layer Illustration), vite.svg (Vite Official Logo - Lightning Bolt, Purple/Cyan Gradient)

### Community 14 - "Api Apifetch"
Cohesion: 0.5
Nodes (2): apiFetch(), getToken()

### Community 15 - "Src Components Ui Toast Jsx"
Cohesion: 0.5
Nodes (0): 

### Community 16 - "Dashboardlayout Dashboardlayout"
Cohesion: 0.5
Nodes (0): 

### Community 17 - "Mobilenav Mobilenav"
Cohesion: 0.5
Nodes (0): 

### Community 18 - "Authenticate Authenticate"
Cohesion: 0.5
Nodes (0): 

### Community 19 - "Eslint Config Js"
Cohesion: 0.5
Nodes (0): 

### Community 20 - "Vite Config Js"
Cohesion: 0.5
Nodes (0): 

### Community 21 - "Server Database Js"
Cohesion: 0.5
Nodes (0): 

### Community 22 - "Server Index Js"
Cohesion: 0.5
Nodes (0): 

### Community 23 - "Index Genid"
Cohesion: 0.5
Nodes (0): 

### Community 24 - "Index Safeuser"
Cohesion: 0.5
Nodes (0): 

### Community 25 - "Index Authenticate"
Cohesion: 0.5
Nodes (0): 

### Community 26 - "Src Main Jsx"
Cohesion: 0.5
Nodes (0): 

### Community 27 - "Src Data Mockdata Js"
Cohesion: 0.5
Nodes (0): 

### Community 28 - "Src Components Ui Card Jsx"
Cohesion: 0.5
Nodes (0): 

### Community 29 - "Src Components Ui Button Jsx"
Cohesion: 0.5
Nodes (0): 

### Community 30 - "Src Components Ui Toggle Jsx"
Cohesion: 0.5
Nodes (0): 

### Community 31 - "Src Components Ui Input Jsx"
Cohesion: 0.5
Nodes (0): 

### Community 32 - "Appcontext Gettoken"
Cohesion: 0.5
Nodes (0): 

### Community 33 - "Appcontext Apifetch"
Cohesion: 0.5
Nodes (0): 

### Community 34 - "Claudemd Export Js"
Cohesion: 0.5
Nodes (1): export.js Utility (CSV + JSON Download)

### Community 35 - "React Svg"
Cohesion: 0.5
Nodes (1): react.svg (React Official Logo - Atom/Electron Style, Cyan)

### Community 36 - "Server Routes Users Js"
Cohesion: 0.5
Nodes (0): 

### Community 37 - "Server Routes Transactions Js"
Cohesion: 0.5
Nodes (0): 

### Community 38 - "Server Routes Data Js"
Cohesion: 0.5
Nodes (0): 

### Community 39 - "Server Routes Groups Js"
Cohesion: 0.5
Nodes (0): 

### Community 40 - "Server Routes Auth Js"
Cohesion: 0.5
Nodes (0): 

### Community 41 - "Server Routes Budgets Js"
Cohesion: 0.5
Nodes (0): 

## Knowledge Gaps
- **24 isolated node(s):** `server/index.js (Express App)`, `server/data/monetrex.db (SQLite File)`, `ErrorBoundary`, `Dashboard.jsx Page`, `Analytics.jsx Page` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Src Components Ui Toast Jsx`** (2 nodes): `Toast.jsx`, `Toast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboardlayout Dashboardlayout`** (2 nodes): `DashboardLayout()`, `DashboardLayout.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mobilenav Mobilenav`** (2 nodes): `MobileNav()`, `MobileNav.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Authenticate Authenticate`** (2 nodes): `authenticate()`, `authenticate.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Eslint Config Js`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config Js`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Database Js`** (1 nodes): `database.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Index Js`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Index Genid`** (1 nodes): `genId()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Index Safeuser`** (1 nodes): `safeUser()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Index Authenticate`** (1 nodes): `authenticate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Src Main Jsx`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Src Data Mockdata Js`** (1 nodes): `mockData.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Src Components Ui Card Jsx`** (1 nodes): `Card.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Src Components Ui Button Jsx`** (1 nodes): `Button.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Src Components Ui Toggle Jsx`** (1 nodes): `Toggle.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Src Components Ui Input Jsx`** (1 nodes): `Input.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Appcontext Gettoken`** (1 nodes): `getToken()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Appcontext Apifetch`** (1 nodes): `apiFetch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Claudemd Export Js`** (1 nodes): `export.js Utility (CSV + JSON Download)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Svg`** (1 nodes): `react.svg (React Official Logo - Atom/Electron Style, Cyan)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Routes Users Js`** (1 nodes): `users.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Routes Transactions Js`** (1 nodes): `transactions.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Routes Data Js`** (1 nodes): `data.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Routes Groups Js`** (1 nodes): `groups.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Routes Auth Js`** (1 nodes): `auth.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Routes Budgets Js`** (1 nodes): `budgets.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.