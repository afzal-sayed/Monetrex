# Monetrex Improvement Roadmap

**Date:** 2026-06-26  
**Scope:** Security hardening + UX polish + Tier 1 features + Tier 2 features  
**Structure:** Option A — sequential phases, each independently shippable  

---

## Context

Monetrex is a React 19 + Express + Supabase expense tracker with multi-user group support. A three-axis audit (security, UX, features) revealed one critical authorization bypass bug, several high-severity security gaps, significant UX friction, and a rich set of missing features. This document captures the full improvement plan organized into sequential phases.

---

## Phase 0 — Critical Hotfix (ship immediately, single PR)

**Branch:** `fix/auth-bypass-and-validation`

These bugs need to land before any other work. They are standalone, surgical fixes.

### S1 — Authorization bypass (audit finding — verified as FALSE POSITIVE)
**File:** `server/routes/transactions.js:63,176`  
**Audit claim:** SQL aliases `membershipId` (camelCase) but auth check reads `membership.membershipid`.  
**Verified:** PostgreSQL folds all unquoted identifiers to lowercase at parse time. `SELECT id AS membershipId` → wire field name is `membershipid`. The `pg` driver has no recasing configured. So `membership.membershipid` IS the correct key. The ownership check functions correctly. No fix needed — do not change the casing.

### S3 — Budget amount: missing `isFinite` guard
**File:** `server/routes/budgets.js:26–27`  
**Bug:** `parseFloat(amount)` is not checked with `Number.isFinite()`. `NaN`/`Infinity` can be written to the DB.  
**Fix:** Add `if (!Number.isFinite(num) || num < 0)` guard before DB write.

---

## Phase 1 — Security Hardening

**Branch:** `fix/security-hardening`  
**Goal:** Close all Critical/High/significant Medium vulnerabilities.

### Input Validation
- **S2 — Category whitelist:** Validate `category` field against `CATEGORIES` list (imported from `src/utils/helpers.js`) on POST and PATCH transaction routes. Reject unknown values with 400.
- **S7 — Date format on POST:** Add regex `/^\d{4}-\d{2}-\d{2}$/` validation to transaction POST (currently only on PATCH at line 87).
- **Spend limit validation (groups.js:124):** Validate `spendLimit` as positive finite number with reasonable upper bound (e.g., 10,000,000).

### Authentication & Sessions
- **S4 — Password policy:** Raise minimum to 12 characters. Add validation in both `auth.js` (signup) and `users.js` (change password). Show requirements in UI.
- **S5 — JWT lifetime:** Reduce from 7d to 24h. Implement refresh token endpoint (`POST /api/auth/refresh`) that issues a new access token if the existing one is valid and not revoked. Store refresh token in httpOnly cookie.
- **S6 — Revoke token on password change:** After successful password change in `users.js`, insert the current JWT's `jti` into `revoked_tokens` table. User must re-login.
- **S11 — Remove localStorage JWT path:** `src/utils/api.js` currently reads from both localStorage and cookie. Remove the localStorage path; auth token should only travel via httpOnly cookie. Update `apiFetch()` and `getToken()` accordingly. Remove `TOKEN_KEY` localStorage usage.

### CSRF & Headers
- **S8 — CSRF session identifier:** Replace the last-16-chars-of-JWT approach with a dedicated random identifier stored in a separate httpOnly cookie (`csrf_id`). Pass this cookie value as the CSRF session key.
- **S10 — Helmet CSP:** Add explicit Content-Security-Policy to `helmet()` call:
  - `default-src: 'self'`
  - `script-src: 'self'` (Vite inlines scripts in dev — allow `'unsafe-inline'` in dev only)
  - `style-src: 'self' 'unsafe-inline'` (Tailwind requires inline styles)
  - `img-src: 'self' data:`
  - `connect-src: 'self'`

### Rate Limiting & DoS
- **S9 — Remove dev console.log:** Remove the password reset link `console.log` in `auth.js:150`. Use a structured debug flag instead.
- **S12 — Category creation rate limit:** Add per-user rate limit to `POST /me/categories`: max 20 categories per hour.
- **S13 — Bulk delete timeout:** Add a `statement_timeout` of 10 seconds to the bulk delete query. Cap accepted IDs at 100 per request (not 500).

### Data Integrity
- **S15 — Soft delete on group owner leave:** When an owner leaves/deletes a group, mark `groups_tbl.deleted_at = NOW()` instead of immediately cascading. Add a cleanup job (or Supabase scheduled function) to purge after 30 days.
- **S16 — User deletion cascade:** Use `ON DELETE CASCADE` foreign key constraints on `memberships`, `transactions`, and `budgets` referencing `users.id`. Verify schema; add if missing.

---

## Phase 2 — UX Polish

**Branch:** `feat/ux-polish`  
**Goal:** Accessibility, friction removal, mobile improvements.

### Accessibility (high impact)
- Add `aria-invalid="true"` and `aria-describedby` to all form Input components when an error state exists. Update the shared `Input` component so all consumers inherit this.
- Add visible focus rings to `glass` and `ghost` button variants (currently missing). Add `focus-visible:ring-2 focus-visible:ring-primary` to button base styles.
- Fix color contrast: change `text-slate-400` used for budget remaining/warning text to `text-slate-600` (dark) / `text-slate-500` (light). Fix amber badge contrast on light backgrounds.
- Link chart divs to `aria-label` with a summary of the data (e.g., "Bar chart: highest spending in Food at ₹4,200").

### Quick UX Wins
- **Password change success toast:** `users.js` route already returns 200 on success; add `showToast('Password changed successfully')` in the Settings page handler.
- **"Coming soon" toggles:** Remove the `<Switch>` component from push notifications and weekly reports. Replace with a static badge reading "Coming soon" — no interactive element.
- **Budget month nav disabled state:** Change disabled chevron opacity from 25% to 50% and add `cursor-not-allowed` with a tooltip "No data before this month".
- **Dark mode toggle in sidebar:** Add a `<button>` with sun/moon icon at the bottom of `Sidebar.jsx` (above the logout button). Mirror the same toggle in the mobile header.
- **Empty state onboarding:** On Dashboard when transaction count is 0, show a centered card: "Add your first transaction to get started" with a direct "Add Transaction" CTA button.
- **Pending invite actions:** On Family page, add "Resend invite" and "Revoke invite" buttons for members in Pending state (backend route already exists for removal).

### Mobile Fixes
- Reduce page padding to `p-4 md:p-6` across all pages to give more breathing room on small phones.
- Add `overflowX: 'auto'` wrapper around Recharts containers so chart axes don't overlap on narrow screens. Set a `minWidth` of 320px on chart containers.
- Add `window.scrollTo(0, 0)` at the top of the filter/sort `useEffect` in Transactions page so updated results are always visible.
- Sticky table header in Transactions: add `sticky top-0 z-10 bg-surface` to the `<thead>` row.

### Bulk Delete UX
- After bulk delete completes, show a toast with "X transactions deleted" plus an **Undo** button. Store the deleted transactions in a `useState` ref for 5 seconds. If Undo is clicked, re-POST them. After 5 seconds, discard.

---

## Phase 3 — Tier 1 Features

**Branch:** `feat/tier1-features`  
**Goal:** High-value features that layer on the existing schema plus one new field.

### Fixed Budget Type (committed expenses)

**Problem:** Budget alerts on rent, OTT subscriptions, and other fixed committed expenses are meaningless noise. These expenses are expected, planned, and non-negotiable.

**Design:**
- Add `budget_type VARCHAR(10) NOT NULL DEFAULT 'flexible' CHECK (budget_type IN ('flexible', 'fixed'))` column to `budgets` table.
- Fixed budget behavior:
  - No warning at 70%, no critical at 90%
  - Progress bar always renders in **slate/neutral blue** with label "Committed"
  - If spending exceeds the fixed budget amount: show a mild info-level note ("₹200 over committed amount") in slate, never red/amber — because the user said overage is always pre-known.
  - Fixed budgets are excluded from the "budget health" insight calculation in `computeInsights()`
- UI changes:
  - "Set Budget" / "Edit Budget" modal: add a "Fixed expense (rent, subscriptions)" toggle. When enabled, label changes from "Budget Limit" to "Expected Amount".
  - Budget card: show a 📌 "Committed" badge instead of the warning/critical status badge.
  - Group fixed vs flexible budgets into two sections on the Budgets page: "Committed Expenses" and "Discretionary Budgets".

### Recurring Transaction Engine

**Problem:** `is_recurring` is just a boolean tag — no auto-creation, no frequency, no management UI.

**Schema delta:** Add a `recurring_rules` table:
```sql
CREATE TABLE recurring_rules (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups_tbl(id),
  member_id TEXT REFERENCES memberships(id),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly','yearly')),
  next_due DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- Backend: new route `GET/POST/PATCH/DELETE /api/recurring`. A Vercel cron function (`api/cron/process-recurring.js`, daily at midnight IST) checks `next_due <= today` and inserts the transaction, then advances `next_due`.
- Frontend: "Recurring Rules" section in Settings (or a dedicated modal). Show upcoming due dates.
- Transactions flagged `is_recurring = true` (existing) remain for backwards compat; new transactions created by the engine automatically set this flag.

### Budget Alerts (70% / 90%)

Infrastructure exists (`users.notifications` boolean, `weekly_report` toggle) but no delivery mechanism.

- Add a Vercel cron function (`api/cron/budget-alerts.js`) that runs daily:
  - For each active group, compute current month's spending per category vs budget
  - If any flexible budget crosses 70% or 90% threshold and hasn't notified this month, send email via a transactional email provider (Resend recommended — simple API, free tier 3,000/month)
  - Log sent alerts in a new `budget_alerts_sent (group_id, category, month, threshold, sent_at)` table to avoid duplicate sends
- UI: show an in-app alert banner on Dashboard when any budget is at/over 90%

### New Analytics Charts

All computed in `src/utils/helpers.js`, rendered in `src/pages/Analytics.jsx`:

1. **Spending Heatmap** — 7-column (days of week) × N-row (weeks) grid showing total spend per day. Color scale: white → indigo based on relative spend. Helps identify "I always overspend on Saturdays."
2. **Year-over-Year Comparison** — Line chart with two series: current year month-by-month vs previous year. Overlay on the same axis.
3. **Member Spending Breakdown** (group mode only) — Horizontal bar chart showing each member's total contribution to group expenses. Only visible to Admins/Owners.
4. **Recurring vs Discretionary** — Pie chart splitting total spend: committed (from `recurring_rules`) vs one-off transactions.

### Data Import (CSV)

- New page section in Settings or a modal on Transactions page: "Import Transactions"
- Accept CSV with columns: `date, title, amount, category, note` (document the format)
- Parse client-side using a lightweight parser (no library needed — split by newlines + commas)
- Show a preview table with validation errors highlighted before committing
- POST valid rows to a new `POST /api/transactions/bulk` endpoint (accepts array, same validation as single POST)
- Max 500 rows per import

### PDF Export

- Use `jsPDF` + `jsPDF-autotable` (both small, no server needed) client-side
- Generate: month header, summary stats, transaction table, budget summary table
- Add "Export PDF" button alongside existing CSV/JSON buttons in Transactions page
- Respect current filter state same as CSV export

---

## Phase 4 — Tier 2 Features (schema changes)

**Branch:** `feat/tier2-features`  
**Goal:** New data model capabilities unlocking collaboration and depth.

### Savings Goals

**New table:**
```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups_tbl(id),
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  target_date DATE,
  color TEXT,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- UI: new dedicated `/goals` route, linked from the sidebar. Card per goal with circular progress, target date countdown, and "Add Contribution" button.
- Contributions are recorded as income transactions tagged to the goal (via a `goal_id TEXT` column added to `transactions` in this phase, nullable). Note: Phase 4 also adds `account_id` to `transactions` — if phases are executed together, add both columns in a single migration.

### Account / Wallet Tracking

**New table:**
```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups_tbl(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('bank','cash','credit_card','investment')),
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- Add nullable `account_id` column to `transactions` table.
- UI: Account selector in Add/Edit Transaction modal. Accounts list in Settings. Net worth widget on Dashboard summing all account balances.

### Bill Splitting

**New table:**
```sql
CREATE TABLE splits (
  id TEXT PRIMARY KEY,
  transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
  member_id TEXT REFERENCES memberships(id),
  amount NUMERIC NOT NULL,
  settled BOOLEAN DEFAULT FALSE,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- On the Add/Edit Transaction modal: "Split between members" toggle (group mode only). Opens a split form showing each member with an amount field (auto-divides equally, editable).
- Family page: "Settlements" section showing who owes whom with a "Mark Settled" button.

### Transaction Tags

- Add `tags TEXT[]` column to `transactions` table (PostgreSQL array).
- UI: tag chip input in Add/Edit Transaction modal (similar to category chips but free-form).
- Filter by tag on Transactions page.
- Tags shown as small chips on each transaction row.

### Spending Forecast

- Compute purely client-side in `computeInsights()`:
  - Take current month's daily average spend (total spend ÷ days elapsed)
  - Project to month-end: `projected = daily_avg × days_in_month`
  - Compare projected to budget: show "You're on track to spend ₹X by month end — ₹Y over budget" or "under budget"
- Display as a single-line callout card on Dashboard below the budget widget.

---

## Verification Plan

### Phase 0
- Log in as a Member-role user → try to edit another member's transaction via `PATCH /api/transactions/:id` → expect 403
- POST a budget with `amount: "abc"` → expect 400

### Phase 1
- POST a transaction with `category: "HACKED"` → expect 400
- Signup with 8-char password → expect validation error
- Change password → check `revoked_tokens` table for old JWT jti
- Check browser DevTools: no JWT in localStorage; only httpOnly cookie

### Phase 2
- Tab through the Budgets page with keyboard only — all interactive elements reachable
- Open Chrome a11y audit — no contrast failures on budget cards
- Resize to 375px — charts scroll horizontally, no axis overlap
- Password change → confirm success toast appears

### Phase 3
- Set a budget as "Fixed" → spend 95% of it → confirm no warning badge appears
- Create a recurring rule (monthly) → advance system date or manually trigger cron → confirm transaction is created
- Import a 50-row CSV → check preview renders, transactions appear after confirm
- Export PDF → verify it downloads and contains data

### Phase 4
- Create a savings goal → add contributions → confirm progress percentage updates
- Add a transaction with account_id → verify account balance updates
- Create a split transaction → verify splits table records are created → mark one settled
