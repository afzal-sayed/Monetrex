# Graph Report - .  (2026-04-16)

## Corpus Check
- Corpus is ~25,057 words - fits in a single context window. You may not need a graph.

## Summary
- 264 nodes · 310 edges · 44 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Context & Actions|App Context & Actions]]
- [[_COMMUNITY_CLAUDE.md Documentation|CLAUDE.md Documentation]]
- [[_COMMUNITY_Page & Component Files|Page & Component Files]]
- [[_COMMUNITY_Deployment Documentation|Deployment Documentation]]
- [[_COMMUNITY_Express Backend Core|Express Backend Core]]
- [[_COMMUNITY_App Shell & UI Components|App Shell & UI Components]]
- [[_COMMUNITY_Vite Template & README|Vite Template & README]]
- [[_COMMUNITY_Context Provider Slices|Context Provider Slices]]
- [[_COMMUNITY_Helpers & Analytics Utils|Helpers & Analytics Utils]]
- [[_COMMUNITY_SVG Icons|SVG Icons]]
- [[_COMMUNITY_ErrorBoundary Class|ErrorBoundary Class]]
- [[_COMMUNITY_Server Helpers|Server Helpers]]
- [[_COMMUNITY_cn Utility & Modal|cn Utility & Modal]]
- [[_COMMUNITY_Export Utils (CSVJSON)|Export Utils (CSV/JSON)]]
- [[_COMMUNITY_Static Assets|Static Assets]]
- [[_COMMUNITY_Auth Route Helpers|Auth Route Helpers]]
- [[_COMMUNITY_API Fetch Utilities|API Fetch Utilities]]
- [[_COMMUNITY_Toast UI Component|Toast UI Component]]
- [[_COMMUNITY_Dashboard Layout|Dashboard Layout]]
- [[_COMMUNITY_Mobile Navigation|Mobile Navigation]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Users Route|Users Route]]
- [[_COMMUNITY_Confirm Modal|Confirm Modal]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_SQLite Database|SQLite Database]]
- [[_COMMUNITY_Express Server Entry|Express Server Entry]]
- [[_COMMUNITY_genId Helper|genId Helper]]
- [[_COMMUNITY_safeUser Helper|safeUser Helper]]
- [[_COMMUNITY_authenticate Import|authenticate Import]]
- [[_COMMUNITY_React Entry Point|React Entry Point]]
- [[_COMMUNITY_Card Component|Card Component]]
- [[_COMMUNITY_Button Component|Button Component]]
- [[_COMMUNITY_Toggle Component|Toggle Component]]
- [[_COMMUNITY_Input Component|Input Component]]
- [[_COMMUNITY_getToken (deprecated)|getToken (deprecated)]]
- [[_COMMUNITY_apiFetch (AppContext)|apiFetch (AppContext)]]
- [[_COMMUNITY_CLAUDE.md Export Ref|CLAUDE.md Export Ref]]
- [[_COMMUNITY_React Logo Asset|React Logo Asset]]
- [[_COMMUNITY_Transactions Route|Transactions Route]]
- [[_COMMUNITY_Data Route|Data Route]]
- [[_COMMUNITY_Groups Route|Groups Route]]
- [[_COMMUNITY_Budgets Route|Budgets Route]]
- [[_COMMUNITY_genJti Helper|genJti Helper]]
- [[_COMMUNITY_Vite Config|Vite Config]]

## God Nodes (most connected - your core abstractions)
1. `useAppContext()` - 15 edges
2. `AppContext / AppProvider` - 12 edges
3. `Express + SQLite Backend` - 11 edges
4. `useDataSlice` - 11 edges
5. `Family Page` - 10 edges
6. `DashboardLayout — Protected Shell` - 9 edges
7. `AppContext.jsx — Central Frontend State` - 8 edges
8. `Application Architecture Overview` - 8 edges
9. `DEPLOY.md — Vercel Deployment Plan` - 8 edges
10. `Settings Page` - 8 edges

## Surprising Connections (you probably didn't know these)
- `favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient)` --semantically_similar_to--> `vite.svg (Vite Official Logo - Lightning Bolt, Purple/Cyan Gradient)`  [INFERRED] [semantically similar]
  public/favicon.svg → src/assets/vite.svg
- `favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient)` --semantically_similar_to--> `hero.png (Isometric Stacked Layer Illustration)`  [INFERRED] [semantically similar]
  public/favicon.svg → src/assets/hero.png
- `computeInsights()` --conceptually_related_to--> `Transaction Amount Sign Convention (negative=expense)`  [INFERRED]
  src/utils/helpers.js → CLAUDE.md
- `isAdmin Derived Flag` --rationale_for--> `Role Hierarchy (Owner > Admin > Member)`  [EXTRACTED]
  src/context/AppContext.jsx → CLAUDE.md
- `Transaction Amount Sign Convention (negative=expense)` --conceptually_related_to--> `memberStats useMemo (per-member financials)`  [INFERRED]
  CLAUDE.md → src/pages/Family.jsx

## Communities

### Community 0 - "App Context & Actions"
Cohesion: 0.07
Nodes (51): activeBudgets Derived State, AddExpenseModal Component, addFamilyMember() Action, addTransaction() Action, Transaction Amount Sign Convention (negative=expense), AppContext / AppProvider, Auth Page, BudgetSection Component (inline Settings) (+43 more)

### Community 1 - "CLAUDE.md Documentation"
Cohesion: 0.06
Nodes (44): Analytics.jsx Page, GET /api/data — Aggregate Data Endpoint, apiFetch() — JWT-attached API Utility, App.jsx (Router Root), AppContext.jsx — Central Frontend State, App.jsx — Root Router with AppProvider + ErrorBoundary, Application Architecture Overview, JWT Auth (bcrypt + 7d token) (+36 more)

### Community 2 - "Page & Component Files"
Cohesion: 0.07
Nodes (16): AddExpenseModal(), emptyForm(), today(), Analytics(), AppInner(), AuthRoute(), ProtectedRoute(), Auth() (+8 more)

### Community 3 - "Deployment Documentation"
Cohesion: 0.13
Nodes (22): src/utils/api.js — apiFetch, getToken, API base URL, Deployment Overview (Vercel + Railway), server/database.js — SQLite Schema (better-sqlite3), server/index.js — Express Entry Point, server/data/monetrex.db (SQLite File), Architecture Table: Dev vs Prod Options, Sync→Async DB Migration (better-sqlite3 → libsql), Pre-Deploy Checklist (+14 more)

### Community 4 - "Express Backend Core"
Cohesion: 0.4
Nodes (10): JWT JTI Revocation (revoked_tokens table), SQLite Database (db), SQLite Schema (users, groups_tbl, memberships, transactions, budgets, revoked_tokens, password_reset_tokens), createDefaultGroup(), genId(), Express App Entry Point, authenticate() middleware, Budget Routes (/api/groups/:groupId/budgets) (+2 more)

### Community 5 - "App Shell & UI Components"
Cohesion: 0.24
Nodes (11): AppInner (inner app component), AuthRoute, ErrorBoundary (React class), App.jsx (Root Component), ProtectedRoute, AppProvider, useAppContext(), AddExpenseModal Component (+3 more)

### Community 6 - "Vite Template & README"
Cohesion: 0.24
Nodes (10): CLAUDE.md Project Guidance, React 19 + Vite SPA Frontend, TypeScript + typescript-eslint Recommendation, @vitejs/plugin-react (Oxc-based), @vitejs/plugin-react-swc (SWC-based), Rationale: React Compiler disabled due to dev/build performance impact, React Compiler (not enabled by default), README — React + Vite Template (+2 more)

### Community 7 - "Context Provider Slices"
Cohesion: 0.25
Nodes (4): AppProvider(), useAuthSlice(), useDataSlice(), useUISlice()

### Community 8 - "Helpers & Analytics Utils"
Cohesion: 0.29
Nodes (2): computeInsights(), InsightsPanel()

### Community 9 - "SVG Icons"
Cohesion: 0.33
Nodes (7): Bluesky Social Icon, Discord Social Icon, Documentation Icon (purple stroke), GitHub Social Icon, Social/Members Icon, icons.svg (SVG Sprite Sheet for Social/UI Icons), X (Twitter) Social Icon

### Community 10 - "ErrorBoundary Class"
Cohesion: 0.4
Nodes (1): ErrorBoundary

### Community 11 - "Server Helpers"
Cohesion: 0.5
Nodes (2): createDefaultGroup(), genId()

### Community 12 - "cn Utility & Modal"
Cohesion: 0.5
Nodes (2): cn(), Modal()

### Community 13 - "Export Utils (CSV/JSON)"
Cohesion: 0.83
Nodes (3): downloadBlob(), exportToCSV(), exportToJSON()

### Community 14 - "Static Assets"
Cohesion: 0.67
Nodes (3): favicon.svg (App Logo - Lightning Bolt / Stacked Layers, Purple Gradient), hero.png (Isometric Stacked Layer Illustration), vite.svg (Vite Official Logo - Lightning Bolt, Purple/Cyan Gradient)

### Community 15 - "Auth Route Helpers"
Cohesion: 0.67
Nodes (0): 

### Community 16 - "API Fetch Utilities"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Toast UI Component"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Dashboard Layout"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Mobile Navigation"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Auth Middleware"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Users Route"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Confirm Modal"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "SQLite Database"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Express Server Entry"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "genId Helper"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "safeUser Helper"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "authenticate Import"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "React Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Card Component"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Button Component"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Toggle Component"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Input Component"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "getToken (deprecated)"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "apiFetch (AppContext)"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "CLAUDE.md Export Ref"
Cohesion: 1.0
Nodes (1): export.js Utility (CSV + JSON Download)

### Community 37 - "React Logo Asset"
Cohesion: 1.0
Nodes (1): react.svg (React Official Logo - Atom/Electron Style, Cyan)

### Community 38 - "Transactions Route"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Data Route"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Groups Route"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Budgets Route"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "genJti Helper"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **50 isolated node(s):** `server/data/monetrex.db (SQLite File)`, `ErrorBoundary`, `Dashboard.jsx Page`, `Analytics.jsx Page`, `Family.jsx Page` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Toast UI Component`** (2 nodes): `Toast.jsx`, `Toast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Layout`** (2 nodes): `DashboardLayout()`, `DashboardLayout.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mobile Navigation`** (2 nodes): `MobileNav()`, `MobileNav.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Middleware`** (2 nodes): `authenticate()`, `authenticate.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Users Route`** (2 nodes): `users.js`, `isValidEmail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Confirm Modal`** (2 nodes): `ConfirmModal()`, `ConfirmModal.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SQLite Database`** (1 nodes): `database.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Express Server Entry`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `genId Helper`** (1 nodes): `genId()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `safeUser Helper`** (1 nodes): `safeUser()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `authenticate Import`** (1 nodes): `authenticate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Entry Point`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Card Component`** (1 nodes): `Card.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Button Component`** (1 nodes): `Button.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Toggle Component`** (1 nodes): `Toggle.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input Component`** (1 nodes): `Input.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `getToken (deprecated)`** (1 nodes): `getToken()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `apiFetch (AppContext)`** (1 nodes): `apiFetch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CLAUDE.md Export Ref`** (1 nodes): `export.js Utility (CSV + JSON Download)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Logo Asset`** (1 nodes): `react.svg (React Official Logo - Atom/Electron Style, Cyan)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Transactions Route`** (1 nodes): `transactions.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Data Route`** (1 nodes): `data.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Groups Route`** (1 nodes): `groups.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Budgets Route`** (1 nodes): `budgets.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `genJti Helper`** (1 nodes): `genJti()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Application Architecture Overview` connect `CLAUDE.md Documentation` to `Vite Template & README`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `Express + SQLite Backend` connect `CLAUDE.md Documentation` to `Deployment Documentation`, `Vite Template & README`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `useAppContext()` connect `Page & Component Files` to `Helpers & Analytics Utils`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `useAppContext()` (e.g. with `ProtectedRoute()` and `AuthRoute()`) actually correct?**
  _`useAppContext()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `server/data/monetrex.db (SQLite File)`, `ErrorBoundary`, `Dashboard.jsx Page` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Context & Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `CLAUDE.md Documentation` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._