# Recurring Transactions Engine

**Date:** 2026-10-14
**Branch:** `feat/recurring-transactions-engine`
**Roadmap:** Phase 3, "Recurring Transaction Engine" (`2026-06-26-monetrex-improvement-roadmap.md`)

## Goal

Users stop re-entering things that repeat (rent, subscriptions, salary). A rule is set once and transactions are created automatically on each due date.

Success criteria:
- A rule produces a real transaction on every due date, including missed ones.
- Generated transactions appear in Transactions and count toward budgets and analytics.
- Rules can be paused, edited and deleted. Deleting a rule keeps the transactions it already created.
- Running the engine twice never creates duplicates.

## Decisions

| Question | Decision |
|---|---|
| Creating rules | Both: the existing "Mark as recurring" toggle in the add-expense modal, and a dedicated `/recurring` page |
| Missed due dates | Backfill every missed occurrence, each dated on its own due date, capped at 12 per run |
| Permissions | Members manage their own rules; Owners and Admins manage all |
| Engine trigger | Daily Vercel cron **and** catch-up on `GET /api/data`, both calling one idempotent function |

## Current state

- `transactions.is_recurring` is a flag only; nothing creates transactions automatically.
- `vercel.json` has no crons. The `budget_alerts_sent` table exists but nothing sends alerts.
- Tables are created in `runSchema()` (`server/database.js`) and extended with idempotent `ALTER TABLE ... IF NOT EXISTS`.
- Dates are `TEXT` (`YYYY-MM-DD`), amounts are `REAL`: negative is an expense, positive is income.

## Data model

New table, following the existing column types (the roadmap sketch used `NUMERIC`/`DATE`/`TIMESTAMPTZ`, which do not match the other tables):

```sql
CREATE TABLE IF NOT EXISTS recurring_rules (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  note TEXT DEFAULT '',
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly','yearly')),
  start_date TEXT NOT NULL,
  next_due TEXT NOT NULL,
  end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);
```

On `transactions`:

```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_rule_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_rule_date_uq
  ON transactions (recurring_rule_id, date) WHERE recurring_rule_id IS NOT NULL;
```

The unique index is what makes double-runs harmless. Generated transactions also set `is_recurring = 1` so existing charts and filters keep working.

**Date rules.** Monthly and yearly occurrences anchor on the `start_date` day and clamp to month end (the 31st becomes Feb 28 or 29; Feb 29 yearly becomes Feb 28 in non-leap years). Each occurrence is computed as `start_date + n periods`, never from the previous result, so dates do not drift.

## Engine (`server/recurring.js`)

- `computeOccurrences(rule, today, cap = 12)` is pure and returns the due dates from `next_due` up to `min(today, end_date)`.
- `processDueRules({ groupIds, today })` selects active rules with `next_due <= today`, inserts each occurrence with `ON CONFLICT DO NOTHING`, then sets `next_due` to the date after the last occurrence handled. If the cap was hit, `next_due` stays at the first uncreated date and the next run continues. A rule past its `end_date` is set inactive.
- "Today" is the UTC date, matching how the app already derives the current month.

**Trigger 1, cron.** `GET /api/cron/process-recurring`, scheduled daily shortly after midnight UTC in `vercel.json`. Requires `Authorization: Bearer $CRON_SECRET` (new env var, compared in constant time). Returns 401 when the secret is unset or wrong. It sits outside CSRF because it is a `GET`.

**Trigger 2, load-time catch-up.** `GET /api/data` calls `processDueRules` for the requesting user's groups before querying. It is wrapped in try/catch: a failure is logged and never blocks loading data.

## API (`server/routes/recurring.js`)

| Route | Behaviour |
|---|---|
| `GET /api/groups/:groupId/recurring` | Members get their own rules; Owners/Admins get all |
| `POST /api/groups/:groupId/recurring` | Creates a rule; a member may only set `memberId` to their own membership, admins any member |
| `PATCH /api/recurring/:id` | Edits `title`, `amount`, `category`, `note`, `frequency`, `end_date`, `is_active`. Affects future occurrences only. Changing `frequency`, or resuming a paused rule, sets `next_due` to the first occurrence on or after today, so a paused period is never backfilled. Removing a member or deleting a group deletes the affected rules |
| `DELETE /api/recurring/:id` | Deletes the rule; its generated transactions stay |

Validation mirrors `server/routes/transactions.js`: group membership check, title up to 200 characters, note up to 500, finite non-zero amount, frequency whitelist, `YYYY-MM-DD` dates, and `end_date >= start_date`. Creating a rule whose `start_date` is today or earlier runs the engine for that rule immediately, so occurrences appear at once. `GET /api/data` also returns `recurringRules`, scoped by role as above.

## Frontend

- **Add-expense modal** (`AddExpenseModal.jsx`): turning on "Mark as recurring" reveals a frequency picker and an optional end date. Saving then creates only the rule; the engine creates the first transaction. This avoids a duplicate first entry. Editing an existing transaction leaves the toggle as a plain tag.
- **`/recurring` page:** a list of rules (title, amount, frequency, next due, active toggle, edit, delete with `ConfirmModal`) and an "Add rule" button. Desktop sidebar entry plus a link from the Transactions page; no seventh item in the mobile bottom nav.
- **State:** `recurringRules` plus create/update/delete actions in `useDataSlice`, exposed through `AppContext`.

## Testing

- Unit tests with `node --test` for `computeOccurrences`: month-end clamping, leap years, yearly Feb 29, biweekly, the cap, `end_date`, inactive rules.
- Manual check of idempotency: run the processor twice and confirm no duplicate rows.
- Browser pass with a throwaway account: create a rule from the modal and from `/recurring`, backfill from a past start date, pause, edit, delete.
- `npm run lint` and `npm run build`.

## Security

- `CRON_SECRET` is required in Vercel and `.env`; the endpoint refuses to run without it.
- Rule routes check group membership and role on every call; a member cannot read or change another member's rule.
- All SQL is parameterised; ids come from `genId()`.

## Out of scope

"End after N occurrences", skipping or editing a single occurrence, notifications, per-user time zones, editing `start_date` after creation.

## Open items

- `CRON_SECRET` must be set in the Vercel dashboard before the cron works in production.
- Budget alerts (also on the roadmap) can reuse the cron setup but are a separate change.
