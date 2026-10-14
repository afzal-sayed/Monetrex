# Recurring Transactions Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users define recurring rules once and have transactions created automatically on each due date, via a daily cron and a catch-up on data load.

**Architecture:** Pure date logic lives in `server/recurringDates.js` (unit tested). One idempotent `processDueRules()` in `server/recurring.js` inserts transactions with `ON CONFLICT DO NOTHING` against a unique `(recurring_rule_id, date)` index, so the cron and the load-time catch-up can both call it safely. CRUD routes live in `server/routes/recurring.js`; the React side adds slice state, an extended add-expense modal, and a `/recurring` page.

**Tech Stack:** Express 5-style routers + `pg` (Supabase Postgres), React 19 + Vite, Node built-in test runner (`node --test`), Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-10-14-recurring-transactions-engine-design.md`

## Global Constraints

- Amounts are `REAL`; negative is an expense, positive is income. Dates are `TEXT` in `YYYY-MM-DD`.
- "Today" is the UTC date: `new Date().toISOString().split('T')[0]`.
- Frequencies are exactly `weekly`, `biweekly`, `monthly`, `yearly`.
- Backfill cap is 12 occurrences per rule per run.
- Cron endpoint is `GET /api/cron/process-recurring`, protected by `Authorization: Bearer $CRON_SECRET` (constant-time compare, 401 if the secret is unset or wrong).
- All SQL is parameterised; ids come from `genId()` (rules `r-<uuid>`, generated transactions `t-<uuid>`).
- Members manage their own rules; Owners and Admins manage all.
- Comments: at most two lines, only where the code cannot say it; no ticket numbers, no history.
- Work on branch `feat/recurring-transactions-engine`. Never commit to `master`. Commit steps below run **only after the user has seen the task tested and confirmed**; commit messages carry no Claude attribution.
- Tests for server logic use `node --test` (no new dependencies). There is no test database; DB-backed behaviour is verified manually against the dev database with a throwaway account (sign up a new one at `/auth`; do not store its credentials in the repo).

## Review Focus

Inputs and conditions the spec implies but no happy-path test exercises, most likely first. Each has a test in the task that owns the code.

1. A monthly rule anchored on the 31st (or yearly on Feb 29) must clamp to month end and snap back, not drift. Pinned in Task 1.
2. A rule created with a start date years in the past must create at most 12 transactions per run, not flood the account, and finish over later runs. Pinned in Task 1 (cap) and Task 3 (live check).
3. The cron and a page load firing at the same moment must not create duplicate transactions. Pinned in Task 3 (run the processor twice, count rows).
4. Pausing then resuming a rule must not backfill the paused period. Pinned in Task 1 (`nextOnOrAfter`) and Task 3 (live check).
5. A removed member or deleted group must not keep generating transactions or leave orphan rules. Pinned in Task 3.
6. A member trying to create a rule for someone else must get a 403, not a silent success. Pinned in Task 3.

---

## File Structure

| File | Responsibility |
|---|---|
| `server/recurringDates.js` (create) | Pure date maths: occurrences, next due, validation. No imports. |
| `server/recurringDates.test.js` (create) | Unit tests for the above. |
| `server/recurring.js` (create) | DB-backed `processDueRules`, `listRulesForUser`, `utcToday`. |
| `server/routes/recurring.js` (create) | Rule CRUD, role checks, field validation. |
| `server/routes/cron.js` (create) | Secret-protected cron entry point. |
| `server/database.js` (modify) | New table, new column, unique index. |
| `server/index.js` (modify) | Mount the two new routers. |
| `server/routes/data.js` (modify) | Catch-up before reading; return `recurringRules`. |
| `server/routes/groups.js` (modify) | Delete rules when a group or member is removed. |
| `vercel.json` (modify) | Daily cron. |
| `.env.example`, `README.md` (modify) | Document `CRON_SECRET`. |
| `src/utils/recurring.js` (create) | Frequency options and labels shared by the UI. |
| `src/context/slices/useDataSlice.js`, `src/context/AppContext.jsx` (modify) | Rule state and actions. |
| `src/components/features/RecurringFields.jsx` (create) | Frequency chips plus end date, shared by both modals. |
| `src/components/features/AddExpenseModal.jsx` (modify) | Rule creation from the recurring toggle and from `ruleMode`. |
| `src/components/features/EditRuleModal.jsx` (create) | Edit an existing rule. |
| `src/pages/Recurring.jsx` (create), `src/App.jsx`, `src/components/layout/Sidebar.jsx`, `src/pages/Transactions.jsx` (modify) | The `/recurring` page and its entry points. |

---

### Task 1: Date logic (pure, unit tested)

**Files:**
- Create: `server/recurringDates.js`
- Test: `server/recurringDates.test.js`

**Interfaces:**
- Produces (all exported from `server/recurringDates.js`):
  - `FREQUENCIES: string[]`
  - `isValidDate(s: string): boolean`
  - `addDays(s: string, k: number): string`
  - `occurrenceAt(startDate: string, frequency: string, n: number): string`
  - `computeOccurrences(rule: { start_date, frequency, next_due, end_date }, today: string, cap?: number): string[]`
  - `nextOnOrAfter(rule: { start_date, frequency }, date: string): string`

- [ ] **Step 1: Write the failing tests**

Create `server/recurringDates.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { occurrenceAt, computeOccurrences, nextOnOrAfter, addDays, isValidDate } from './recurringDates.js';

test('monthly on the 31st clamps to month end and snaps back without drifting', () => {
  const dates = [0, 1, 2, 3].map((n) => occurrenceAt('2026-01-31', 'monthly', n));
  assert.deepEqual(dates, ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
});

test('monthly clamps to Feb 29 in a leap year', () => {
  assert.equal(occurrenceAt('2028-01-31', 'monthly', 1), '2028-02-29');
});

test('yearly on Feb 29 clamps in non-leap years and returns in leap years', () => {
  assert.equal(occurrenceAt('2024-02-29', 'yearly', 1), '2025-02-28');
  assert.equal(occurrenceAt('2024-02-29', 'yearly', 4), '2028-02-29');
});

test('weekly and biweekly step by 7 and 14 days', () => {
  assert.equal(occurrenceAt('2026-10-14', 'weekly', 2), '2026-10-28');
  assert.equal(occurrenceAt('2026-10-14', 'biweekly', 1), '2026-10-28');
});

test('monthly rolls over the year boundary', () => {
  assert.equal(occurrenceAt('2026-11-15', 'monthly', 3), '2027-02-15');
});

test('computeOccurrences backfills every missed date up to today', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly', next_due: '2026-07-10', end_date: null };
  assert.deepEqual(computeOccurrences(rule, '2026-10-14'), ['2026-07-10', '2026-08-10', '2026-09-10', '2026-10-10']);
});

test('computeOccurrences starts at next_due, not start_date', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly', next_due: '2026-09-10', end_date: null };
  assert.deepEqual(computeOccurrences(rule, '2026-10-14'), ['2026-09-10', '2026-10-10']);
});

test('computeOccurrences returns nothing when next_due is in the future', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly', next_due: '2026-11-10', end_date: null };
  assert.deepEqual(computeOccurrences(rule, '2026-10-14'), []);
});

test('computeOccurrences caps a long backlog at 12 and keeps order', () => {
  const rule = { start_date: '2025-01-01', frequency: 'weekly', next_due: '2025-01-01', end_date: null };
  const dates = computeOccurrences(rule, '2026-10-14');
  assert.equal(dates.length, 12);
  assert.equal(dates[0], '2025-01-01');
  assert.equal(dates[11], '2025-03-19');
});

test('computeOccurrences stops at end_date', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly', next_due: '2026-07-10', end_date: '2026-09-15' };
  assert.deepEqual(computeOccurrences(rule, '2026-10-14'), ['2026-07-10', '2026-08-10', '2026-09-10']);
});

test('nextOnOrAfter never returns a paused-period date earlier than the given day', () => {
  const rule = { start_date: '2026-07-10', frequency: 'monthly' };
  assert.equal(nextOnOrAfter(rule, '2026-10-14'), '2026-11-10');
  assert.equal(nextOnOrAfter(rule, '2026-10-10'), '2026-10-10');
  assert.equal(nextOnOrAfter(rule, '2026-01-01'), '2026-07-10');
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('isValidDate rejects malformed and impossible dates', () => {
  assert.equal(isValidDate('2026-02-28'), true);
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2026-2-1'), false);
  assert.equal(isValidDate('abc'), false);
  assert.equal(isValidDate(undefined), false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test server/recurringDates.test.js`
Expected: FAIL with `Cannot find module '.../server/recurringDates.js'`.

- [ ] **Step 3: Write the implementation**

Create `server/recurringDates.js`:

```js
export const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'yearly'];

const MAX_STEPS = 5000;
const pad = (n) => String(n).padStart(2, '0');
const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
};
const toStr = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const isValidDate = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const { y, m, d } = parse(s);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

export const addDays = (s, k) => {
  const { y, m, d } = parse(s);
  return toStr(new Date(Date.UTC(y, m - 1, d + k)));
};

// Computed from the start date each time so month-end clamping never drifts.
export const occurrenceAt = (startDate, frequency, n) => {
  const { y, m, d } = parse(startDate);
  if (frequency === 'weekly' || frequency === 'biweekly') {
    return toStr(new Date(Date.UTC(y, m - 1, d + (frequency === 'weekly' ? 7 : 14) * n)));
  }
  const total = (m - 1) + (frequency === 'monthly' ? n : 12 * n);
  const year = y + Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${pad(month)}-${pad(Math.min(d, daysInMonth(year, month)))}`;
};

export const computeOccurrences = ({ start_date, frequency, next_due, end_date }, today, cap = 12) => {
  const limit = end_date && end_date < today ? end_date : today;
  const dates = [];
  for (let n = 0; dates.length < cap && n < MAX_STEPS; n++) {
    const date = occurrenceAt(start_date, frequency, n);
    if (date > limit) break;
    if (date >= next_due) dates.push(date);
  }
  return dates;
};

export const nextOnOrAfter = ({ start_date, frequency }, date) => {
  for (let n = 0; n < MAX_STEPS; n++) {
    const candidate = occurrenceAt(start_date, frequency, n);
    if (candidate >= date) return candidate;
  }
  return occurrenceAt(start_date, frequency, MAX_STEPS);
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test server/recurringDates.test.js`
Expected: `# pass 13`, `# fail 0`.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit (after the user confirms)**

```bash
git add server/recurringDates.js server/recurringDates.test.js
git commit -m "feat: add recurring rule date logic"
```

---

### Task 2: Schema and processing engine

**Files:**
- Modify: `server/database.js` (inside `runSchema()` after the `custom_categories` table, and in `runMigrations()`)
- Create: `server/recurring.js`

**Interfaces:**
- Consumes: `computeOccurrences`, `nextOnOrAfter`, `addDays` from Task 1; `query` from `server/database.js`; `genId` from `server/helpers.js`.
- Produces (from `server/recurring.js`):
  - `utcToday(): string`
  - `processDueRules({ groupIds?: string[], ruleId?: string, today?: string }): Promise<number>` returns the number of transactions created.
  - `listRulesForUser(userId: string, groupIds: string[]): Promise<object[]>`

- [ ] **Step 1: Add the table to `runSchema()`**

In `server/database.js`, directly after the `custom_categories` table definition (before the closing `` ` `` of the schema string), add:

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

- [ ] **Step 2: Add the column and unique index to `runMigrations()`**

Append inside `runMigrations()` after the existing `budget_type` statement:

```js
  await pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_rule_id TEXT')
    .catch((e) => console.error('recurring_rule_id migration failed:', e.message));
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS transactions_rule_date_uq
     ON transactions (recurring_rule_id, date) WHERE recurring_rule_id IS NOT NULL`
  ).catch((e) => console.error('transactions_rule_date_uq migration failed:', e.message));
```

- [ ] **Step 3: Create the engine**

Create `server/recurring.js`:

```js
import { query } from './database.js';
import { genId } from './helpers.js';
import { computeOccurrences, nextOnOrAfter, addDays } from './recurringDates.js';

export const utcToday = () => new Date().toISOString().split('T')[0];

// Idempotent: the (recurring_rule_id, date) unique index makes concurrent or repeated runs safe.
export async function processDueRules({ groupIds = null, ruleId = null, today = utcToday() } = {}) {
  const conditions = [
    'is_active = 1',
    'next_due <= $1',
    'EXISTS (SELECT 1 FROM memberships m WHERE m.id = recurring_rules.member_id)',
  ];
  const params = [today];
  if (groupIds) { params.push(groupIds); conditions.push(`group_id = ANY($${params.length})`); }
  if (ruleId)   { params.push(ruleId);   conditions.push(`id = $${params.length}`); }

  const rules = await query(`SELECT * FROM recurring_rules WHERE ${conditions.join(' AND ')}`, params);

  let created = 0;
  for (const rule of rules) {
    const dates = computeOccurrences(rule, today);
    for (const date of dates) {
      const inserted = await query(
        `INSERT INTO transactions (id, group_id, member_id, title, amount, category, note, date, is_recurring, recurring_rule_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9)
         ON CONFLICT (recurring_rule_id, date) WHERE recurring_rule_id IS NOT NULL DO NOTHING
         RETURNING id`,
        [`t-${genId()}`, rule.group_id, rule.member_id, rule.title, rule.amount, rule.category, rule.note || '', date, rule.id]
      );
      created += inserted.length;
    }

    const nextDue = dates.length > 0
      ? nextOnOrAfter(rule, addDays(dates[dates.length - 1], 1))
      : rule.next_due;
    const stillActive = !(rule.end_date && nextDue > rule.end_date);
    await query(
      'UPDATE recurring_rules SET next_due = $1, is_active = $2 WHERE id = $3',
      [nextDue, stillActive ? 1 : 0, rule.id]
    );
  }
  return created;
}

export async function listRulesForUser(userId, groupIds) {
  return query(
    `SELECT r.* FROM recurring_rules r
     JOIN memberships m ON m.group_id = r.group_id AND m.user_id = $1
     WHERE r.group_id = ANY($2) AND (m.role IN ('Owner', 'Admin') OR r.member_id = m.id)
     ORDER BY r.next_due ASC`,
    [userId, groupIds]
  );
}
```

- [ ] **Step 4: Verify the schema on the dev database**

Run:

```bash
node --env-file=.env --input-type=module -e "
const { query } = await import('./server/database.js');
const cols = await query(\"SELECT column_name FROM information_schema.columns WHERE table_name='recurring_rules' ORDER BY ordinal_position\");
const txn = await query(\"SELECT column_name FROM information_schema.columns WHERE table_name='transactions' AND column_name='recurring_rule_id'\");
const idx = await query(\"SELECT indexname FROM pg_indexes WHERE indexname='transactions_rule_date_uq'\");
console.log(cols.map(c => c.column_name).join(','), '|', txn.length, '|', idx.length);
process.exit(0);
"
```

Expected: `id,group_id,member_id,title,amount,category,note,frequency,start_date,next_due,end_date,is_active,created_by,created_at | 1 | 1`

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit (after the user confirms)**

```bash
git add server/database.js server/recurring.js
git commit -m "feat: add recurring rules schema and processing engine"
```

---

### Task 3: API routes, cron, catch-up and cleanup

**Files:**
- Create: `server/routes/recurring.js`, `server/routes/cron.js`
- Modify: `server/index.js` (imports near line 14, mounts near line 83), `server/routes/data.js`, `server/routes/groups.js` (lines 74-81 and 165), `vercel.json`

**Interfaces:**
- Consumes: everything from Tasks 1 and 2.
- Produces: `POST/GET /api/groups/:groupId/recurring`, `PATCH/DELETE /api/recurring/:id`, `GET /api/cron/process-recurring`; `GET /api/data` gains a `recurringRules` array. Rule objects are raw rows (`id, group_id, member_id, title, amount, category, note, frequency, start_date, next_due, end_date, is_active, created_by`). Request bodies use camelCase `title, amount, category, note, memberId, frequency, startDate, endDate, isActive`.

- [ ] **Step 1: Create the rule routes**

Create `server/routes/recurring.js`:

```js
import { Router } from 'express';
import { query, run } from '../database.js';
import { genId } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';
import { processDueRules, listRulesForUser, utcToday } from '../recurring.js';
import { FREQUENCIES, isValidDate, nextOnOrAfter } from '../recurringDates.js';

const router = Router();
const isAdminRole = (role) => ['Owner', 'Admin'].includes(role);

const parseRuleFields = (body, { create }) => {
  const { title, amount, category, note, frequency, startDate, endDate } = body;
  const values = {};

  if (create || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) return { error: 'Title is required' };
    if (title.trim().length > 200) return { error: 'Title must be 200 characters or fewer' };
    values.title = title.trim();
  }
  if (create || amount !== undefined) {
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed === 0) return { error: 'Amount must be a non-zero number' };
    values.amount = parsed;
  }
  if (category !== undefined) {
    if (typeof category !== 'string' || category.length > 100) return { error: 'Category must be 100 characters or fewer' };
    values.category = category || 'General';
  }
  if (note !== undefined && note !== null) {
    if (typeof note !== 'string' || note.length > 500) return { error: 'Note must be 500 characters or fewer' };
    values.note = note.trim();
  }
  if (create || frequency !== undefined) {
    if (!FREQUENCIES.includes(frequency)) return { error: 'Frequency must be weekly, biweekly, monthly or yearly' };
    values.frequency = frequency;
  }
  if (create) {
    if (!isValidDate(startDate)) return { error: 'Start date must be a valid YYYY-MM-DD date' };
    values.start_date = startDate;
  }
  if (endDate !== undefined) {
    if (endDate === null || endDate === '') values.end_date = null;
    else if (isValidDate(endDate)) values.end_date = endDate;
    else return { error: 'End date must be a valid YYYY-MM-DD date' };
  }
  return { values };
};

const getMembership = async (groupId, userId) => {
  const [membership] = await query(
    'SELECT id, role FROM memberships WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return membership;
};

router.get('/groups/:groupId/recurring', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!(await getMembership(groupId, req.userId))) return res.status(403).json({ error: 'Not a member of this group' });
    const rules = await listRulesForUser(req.userId, [groupId]);
    res.json({ rules });
  } catch (e) {
    console.error('List recurring rules error:', e);
    res.status(500).json({ error: 'Failed to load recurring rules' });
  }
});

router.post('/groups/:groupId/recurring', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const membership = await getMembership(groupId, req.userId);
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const { error, values } = parseRuleFields(req.body, { create: true });
    if (error) return res.status(400).json({ error });
    if (values.end_date && values.end_date < values.start_date) {
      return res.status(400).json({ error: 'End date must be on or after the start date' });
    }

    let memberId = membership.id;
    if (req.body.memberId && req.body.memberId !== membership.id) {
      if (!isAdminRole(membership.role)) return res.status(403).json({ error: 'You can only create rules for yourself' });
      const [target] = await query('SELECT id FROM memberships WHERE id = $1 AND group_id = $2', [req.body.memberId, groupId]);
      if (!target) return res.status(400).json({ error: 'Invalid member for this group' });
      memberId = target.id;
    }

    const id = `r-${genId()}`;
    await run(
      `INSERT INTO recurring_rules
         (id, group_id, member_id, title, amount, category, note, frequency, start_date, next_due, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11)`,
      [id, groupId, memberId, values.title, values.amount, values.category || 'General', values.note || '',
        values.frequency, values.start_date, values.end_date ?? null, req.userId]
    );
    await processDueRules({ ruleId: id });

    const [rule] = await query('SELECT * FROM recurring_rules WHERE id = $1', [id]);
    res.status(201).json({ rule });
  } catch (e) {
    console.error('Create recurring rule error:', e);
    res.status(500).json({ error: 'Failed to create recurring rule' });
  }
});

const loadEditableRule = async (req, res) => {
  const [rule] = await query('SELECT * FROM recurring_rules WHERE id = $1', [req.params.id]);
  if (!rule) { res.status(404).json({ error: 'Rule not found' }); return null; }
  const membership = await getMembership(rule.group_id, req.userId);
  if (!membership || (!isAdminRole(membership.role) && rule.member_id !== membership.id)) {
    res.status(403).json({ error: 'You can only manage your own recurring rules' });
    return null;
  }
  return rule;
};

router.patch('/recurring/:id', authenticate, async (req, res) => {
  try {
    const rule = await loadEditableRule(req, res);
    if (!rule) return;

    const { error, values } = parseRuleFields(req.body, { create: false });
    if (error) return res.status(400).json({ error });
    if (req.body.isActive !== undefined) values.is_active = req.body.isActive ? 1 : 0;
    if (Object.keys(values).length === 0) return res.status(400).json({ error: 'No updates provided' });

    const merged = { ...rule, ...values };
    if (merged.end_date && merged.end_date < merged.start_date) {
      return res.status(400).json({ error: 'End date must be on or after the start date' });
    }

    const resuming = values.is_active === 1 && rule.is_active === 0;
    const frequencyChanged = values.frequency !== undefined && values.frequency !== rule.frequency;
    if (resuming || frequencyChanged) values.next_due = nextOnOrAfter(merged, utcToday());

    const keys = Object.keys(values);
    await run(
      `UPDATE recurring_rules SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $${keys.length + 1}`,
      [...Object.values(values), rule.id]
    );
    await processDueRules({ ruleId: rule.id });

    const [updated] = await query('SELECT * FROM recurring_rules WHERE id = $1', [rule.id]);
    res.json({ rule: updated });
  } catch (e) {
    console.error('Update recurring rule error:', e);
    res.status(500).json({ error: 'Failed to update recurring rule' });
  }
});

router.delete('/recurring/:id', authenticate, async (req, res) => {
  try {
    const rule = await loadEditableRule(req, res);
    if (!rule) return;
    await run('DELETE FROM recurring_rules WHERE id = $1', [rule.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete recurring rule error:', e);
    res.status(500).json({ error: 'Failed to delete recurring rule' });
  }
});

export default router;
```

- [ ] **Step 2: Create the cron route**

Create `server/routes/cron.js`:

```js
import { Router } from 'express';
import { timingSafeEqual } from 'crypto';
import { processDueRules } from '../recurring.js';

const router = Router();

const hasValidSecret = (header) => {
  /* eslint-disable-next-line no-undef */
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(header || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

router.get('/process-recurring', async (req, res) => {
  if (!hasValidSecret(req.headers.authorization)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const created = await processDueRules();
    res.json({ created });
  } catch (e) {
    console.error('Cron process-recurring error:', e);
    res.status(500).json({ error: 'Failed to process recurring rules' });
  }
});

export default router;
```

- [ ] **Step 3: Mount the routers**

In `server/index.js` add after the `categoryRoutes` import:

```js
import recurringRoutes   from './routes/recurring.js';
import cronRoutes        from './routes/cron.js';
```

and after `app.use('/api/me/categories', categoryRoutes);` add:

```js
app.use('/api',              recurringRoutes);
app.use('/api/cron',         cronRoutes);
```

- [ ] **Step 4: Catch up on data load and return the rules**

In `server/routes/data.js` add the import:

```js
import { processDueRules, listRulesForUser } from '../recurring.js';
```

Directly after `groupIds` is finalised (after the `if (groupIds.length === 0) { ... }` block) add:

```js
    try {
      await processDueRules({ groupIds });
    } catch (e) {
      console.error('Recurring catch-up failed:', e);
    }
```

After the `customCategories` query add `const recurringRules = await listRulesForUser(req.userId, groupIds);` and change the response to:

```js
    res.json({ groups, memberships, transactions, budgets, customCategories, recurringRules });
```

- [ ] **Step 5: Delete rules when a group or member goes away**

In `server/routes/groups.js`, in the Owner branch of `/:groupId/leave`, add as the first delete:

```js
      await run('DELETE FROM recurring_rules WHERE group_id = $1', [groupId]);
```

Directly before `await run('DELETE FROM memberships WHERE id = $1', [membership.id]);` (the non-owner leave) add:

```js
    await run('DELETE FROM recurring_rules WHERE member_id = $1', [membership.id]);
```

Directly before `await run('DELETE FROM memberships WHERE id = $1', [memberId]);` (remove member) add:

```js
    await run('DELETE FROM recurring_rules WHERE member_id = $1', [memberId]);
```

- [ ] **Step 6: Schedule the cron**

Replace `vercel.json` with:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "crons": [
    { "path": "/api/cron/process-recurring", "schedule": "5 0 * * *" }
  ]
}
```

- [ ] **Step 7: Lint and start the server with a cron secret**

Run: `npm run lint`
Expected: no errors.

Run (in the background): `CRON_SECRET=local-test-secret npm run dev`
Expected: Vite on 5173 and `Monetrex API → http://localhost:3001`, no migration errors in the log.

- [ ] **Step 8: Verify the cron endpoint's auth**

Run:

```bash
curl -s -o /dev/null -w "%{http_code}\n" localhost:3001/api/cron/process-recurring
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer wrong" localhost:3001/api/cron/process-recurring
curl -s -H "Authorization: Bearer local-test-secret" localhost:3001/api/cron/process-recurring
```

Expected: `401`, `401`, then `{"created":0}` (or a small number if other rules exist).

- [ ] **Step 9: Verify the rules API in the browser (Playwright)**

Open `http://localhost:5173/auth`, sign up a throwaway account, then run this in the page (`browser_evaluate`). It defines a helper and walks the Review Focus cases:

```js
async () => {
  const csrf = (await (await fetch('/api/csrf-token', { credentials: 'include' })).json()).token;
  const call = async (method, path, body) => {
    const r = await fetch('/api' + path, { method, credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
      body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json() };
  };
  const data = async () => (await fetch('/api/data', { credentials: 'include' })).json();
  const d0 = await data();
  const gid = d0.groups[0].id;
  const out = {};

  const countFor = (id) => data().then(d => d.transactions.filter(t => t.recurring_rule_id === id).length);

  // 41 weekly occurrences fall between 2026-01-01 and 2026-10-14; each /api/data load catches up 12 more.
  const weekly = await call('POST', `/groups/${gid}/recurring`, { title: 'Backlog', amount: -10, category: 'General', frequency: 'weekly', startDate: '2026-01-01' });
  out.backlogStatus = weekly.status;                                  // 201
  out.loads = [await countFor(weekly.body.rule.id), await countFor(weekly.body.rule.id),
               await countFor(weekly.body.rule.id), await countFor(weekly.body.rule.id)];   // [24, 36, 41, 41]

  const monthly = await call('POST', `/groups/${gid}/recurring`, { title: 'Rent', amount: -500, category: 'Rent', frequency: 'monthly', startDate: '2026-07-31' });
  const rentDates = () => data().then(d => d.transactions.filter(t => t.recurring_rule_id === monthly.body.rule.id).map(t => t.date).sort());
  out.rent = await rentDates();         // [2026-07-31, 2026-08-31, 2026-09-30] (Sept clamped), nothing for Oct 31 yet
  out.rentAgain = (await rentDates()).length;   // 3 again: repeated loads never duplicate

  await call('PATCH', `/recurring/${monthly.body.rule.id}`, { isActive: false });
  const resume = await call('PATCH', `/recurring/${monthly.body.rule.id}`, { isActive: true });
  out.resumedNextDue = resume.body.rule.next_due;   // first occurrence on or after today (2026-10-31 on 2026-10-14), no backfill

  out.badFreq = (await call('POST', `/groups/${gid}/recurring`, { title: 'x', amount: -1, frequency: 'daily', startDate: '2026-01-01' })).status;   // 400
  out.zeroAmount = (await call('POST', `/groups/${gid}/recurring`, { title: 'x', amount: 0, frequency: 'monthly', startDate: '2026-01-01' })).status;   // 400
  out.deleted = (await call('DELETE', `/recurring/${weekly.body.rule.id}`)).status;   // 200
  out.keptRows = await countFor(weekly.body.rule.id);   // 41: deleting a rule keeps its transactions
  return out;
}
```

Expected: `backlogStatus` 201; `loads` `[24, 36, 41, 41]` (12 on create plus 12 per load until caught up, never more than 12 at once); `rent` the three clamped dates; `rentAgain` 3; `resumedNextDue` on or after today and not a past date; `badFreq` and `zeroAmount` 400; `deleted` 200; `keptRows` 41. The dates assume you run this on 2026-10-14; if later, adjust the rent dates and counts to the same logic.

- [ ] **Step 10: Verify permissions and cleanup**

Using a second throwaway account added to the first account's group as a Member (via the Family page), call `POST /groups/<gid>/recurring` with the first member's `memberId` and confirm `403`. Then remove that member from the group and confirm `GET /api/data` for the owner no longer lists that member's rules, and that `DELETE` on another member's rule returns `403` for the member.

Expected: `403`, rules gone after removal.

- [ ] **Step 11: Commit (after the user confirms)**

```bash
git add server/routes/recurring.js server/routes/cron.js server/index.js server/routes/data.js server/routes/groups.js vercel.json
git commit -m "feat: add recurring rules API, cron and load-time catch-up"
```

---

### Task 4: Frontend state

**Files:**
- Create: `src/utils/recurring.js`
- Modify: `src/context/slices/useDataSlice.js`, `src/context/AppContext.jsx`

**Interfaces:**
- Consumes: the API from Task 3.
- Produces: from `useAppContext()`: `recurringRules` (active group's rules), `createRecurringRule(rule): Promise<boolean>`, `updateRecurringRule(id, updates): Promise<boolean>`, `deleteRecurringRule(id): Promise<boolean>`. From `src/utils/recurring.js`: `FREQUENCY_OPTIONS: { value, label }[]` and `FREQUENCY_LABELS: Record<string, string>`.

- [ ] **Step 1: Create the shared options**

Create `src/utils/recurring.js`:

```js
export const FREQUENCY_OPTIONS = [
  { value: 'weekly',   label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly',  label: 'Monthly' },
  { value: 'yearly',   label: 'Yearly' },
];

export const FREQUENCY_LABELS = Object.fromEntries(FREQUENCY_OPTIONS.map((o) => [o.value, o.label]));
```

- [ ] **Step 2: Extend the data slice**

In `src/context/slices/useDataSlice.js`:

Add state after `customCategories`:

```js
  const [recurringRules,    setRecurringRules]    = useState([]);
```

In `clearAll` add `setRecurringRules([]);`. In `leaveGroup`'s `data.deleted` branch add:

```js
        setRecurringRules((prev) => prev.filter((r) => r.group_id !== groupId));
```

Before the final `return {`, add:

```js
  // ── Recurring rules ───────────────────────────────────────────────────────
  const createRecurringRule = async (rule) => {
    if (!activeGroupId) { showToast('No active group selected', 'error'); return false; }
    try {
      const res  = await apiFetch(`/groups/${activeGroupId}/recurring`, { method: 'POST', body: JSON.stringify(rule) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to create recurring rule', 'error'); return false; }
      setRecurringRules((prev) => [...prev, data.rule]);
      showToast('Recurring rule created!');
      return true;
    } catch {
      showToast('Failed to create recurring rule', 'error');
      return false;
    }
  };

  const updateRecurringRule = async (id, updates) => {
    try {
      const res  = await apiFetch(`/recurring/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to update rule', 'error'); return false; }
      setRecurringRules((prev) => prev.map((r) => (r.id === id ? data.rule : r)));
      showToast('Rule updated!');
      return true;
    } catch {
      showToast('Failed to update rule', 'error');
      return false;
    }
  };

  const deleteRecurringRule = async (id) => {
    try {
      const res = await apiFetch(`/recurring/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); showToast(d.error || 'Failed to delete rule', 'error'); return false; }
      setRecurringRules((prev) => prev.filter((r) => r.id !== id));
      showToast('Rule deleted', 'info');
      return true;
    } catch {
      showToast('Failed to delete rule', 'error');
      return false;
    }
  };

```

In the returned object add `recurringRules, setRecurringRules,` after `customCategories, setCustomCategories,` and `createRecurringRule, updateRecurringRule, deleteRecurringRule,` after `addCustomCategory, deleteCustomCategory,`.

- [ ] **Step 3: Wire it into `AppContext.jsx`**

Add to the destructuring from `data`: `recurringRules, setRecurringRules,` and `createRecurringRule, updateRecurringRule, deleteRecurringRule,`.

In `fetchData`, after `setCustomCategories(d.customCategories || []);` add `setRecurringRules(d.recurringRules || []);`, and add `setRecurringRules` to the `useCallback` dependency array.

Above the `monthlyData` memo add:

```js
  const activeRecurringRules = useMemo(
    () => recurringRules.filter((r) => r.group_id === activeGroupId),
    [recurringRules, activeGroupId]
  );
```

In the provider value, after `fetchData,` add:

```js
      recurringRules: activeRecurringRules,
      createRecurringRule, updateRecurringRule, deleteRecurringRule,
```

- [ ] **Step 4: Verify**

Run: `npm run lint && npm run build`
Expected: no lint errors; build succeeds.

- [ ] **Step 5: Commit (after the user confirms)**

```bash
git add src/utils/recurring.js src/context/slices/useDataSlice.js src/context/AppContext.jsx
git commit -m "feat: add recurring rules state to the data slice"
```

---

### Task 5: Create rules from the add-expense modal

**Files:**
- Create: `src/components/features/RecurringFields.jsx`
- Modify: `src/components/features/AddExpenseModal.jsx`

**Interfaces:**
- Consumes: `createRecurringRule`, `fetchData`, `isAdmin`, `currentMembership` from `useAppContext()`; `FREQUENCY_OPTIONS` from Task 4.
- Produces: `RecurringFields({ frequency, endDate, onChange(key, value) })`; `AddExpenseModal` gains the prop `ruleMode?: boolean`.

- [ ] **Step 1: Create the shared fields component**

Create `src/components/features/RecurringFields.jsx`:

```jsx
import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Input } from '../ui/Input';
import { FREQUENCY_OPTIONS } from '../../utils/recurring';

export const RecurringFields = ({ frequency, endDate, onChange }) => (
  <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Repeats</p>
      <div className="flex flex-wrap gap-1.5">
        {FREQUENCY_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange('frequency', o.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              frequency === o.value
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
    <Input
      label="Ends on (optional)" icon={CalendarDays}
      type="date"
      value={endDate}
      onChange={(e) => onChange('endDate', e.target.value)}
    />
  </div>
);
```

- [ ] **Step 2: Extend `AddExpenseModal`**

In `src/components/features/AddExpenseModal.jsx`:

Add the import `import { RecurringFields } from './RecurringFields';`.

Add to `emptyForm`'s returned object: `frequency: 'monthly',` and `endDate: '',`. In the `initialData` branch of the populate effect's `setForm({ ... })` add the same two fields.

Change the component signature and context destructuring:

```jsx
export const AddExpenseModal = ({ isOpen, onClose, initialData = null, ruleMode = false }) => {
  const {
    addTransaction, updateTransaction, family, customCategories, addCustomCategory,
    createRecurringRule, fetchData, isAdmin, currentMembership,
  } = useAppContext();
```

After the `set` helper add:

```jsx
  const creatingRule = !initialData && (ruleMode || form.isRecurring);
```

In `handleSubmit`, inside `try {`, replace the `if (initialData) { ... } else { ... }` block and the `onClose();` with:

```jsx
      if (creatingRule) {
        const ok = await createRecurringRule({
          title:     form.title.trim(),
          amount:    numericAmount,
          category:  form.category,
          note:      form.note.trim(),
          memberId:  isAdmin ? (form.memberId || undefined) : currentMembership?.id,
          frequency: form.frequency,
          startDate: form.date,
          endDate:   form.endDate || null,
        });
        if (!ok) return;
        await fetchData();
      } else if (initialData) {
        await updateTransaction(initialData.id, payload);
      } else {
        await addTransaction(payload);
      }
      onClose();
```

Replace the `title` computation block with:

```jsx
  let title = 'Add Income';
  if (ruleMode) title = 'New Recurring Rule';
  else if (initialData) title = 'Edit Transaction';
  else if (type === 'expense') title = 'Add Expense';
```

Change the date input's label to `label={creatingRule ? 'Start date' : 'Date'}`.

Wrap the "Assign to" block's condition from `{family.length > 0 && (` to `{family.length > 0 && (isAdmin || !creatingRule) && (`.

Replace the whole "Recurring toggle" block with:

```jsx
        {/* Recurring toggle */}
        {!ruleMode && (
          <div className="flex items-start justify-between px-1 gap-4">
            <div className="flex items-start gap-2">
              <RefreshCw size={14} className="text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300">Mark as recurring</p>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  {initialData
                    ? 'Tags this entry as a repeating cost.'
                    : 'Adds this automatically on a schedule.'}
                </p>
              </div>
            </div>
            <Toggle checked={form.isRecurring} onChange={(v) => set('isRecurring', v)} />
          </div>
        )}
        {creatingRule && (
          <RecurringFields frequency={form.frequency} endDate={form.endDate} onChange={set} />
        )}
```

Change the submit button label to `initialData ? 'Save Changes' : (creatingRule ? 'Create Rule' : 'Add Transaction')`, written as a small helper variable above the `return` to avoid a nested ternary:

```jsx
  let submitLabel = 'Add Transaction';
  if (initialData) submitLabel = 'Save Changes';
  else if (creatingRule) submitLabel = 'Create Rule';
```

and use `: submitLabel}` in the button.

- [ ] **Step 3: Verify**

Run: `npm run lint && npm run build`
Expected: no lint errors; build succeeds.

Then in the browser (dev servers running, throwaway account): open Transactions, "Add" a monthly expense dated three months ago with "Mark as recurring" on, frequency Monthly.
Expected: the modal shows the frequency chips and end-date field and a "Create Rule" button; after saving, four transactions appear (one per month through today) each with the repeat icon, and no duplicate first entry.

- [ ] **Step 4: Commit (after the user confirms)**

```bash
git add src/components/features/RecurringFields.jsx src/components/features/AddExpenseModal.jsx
git commit -m "feat: create recurring rules from the add-expense modal"
```

---

### Task 6: Recurring page and entry points

**Files:**
- Create: `src/components/features/EditRuleModal.jsx`, `src/pages/Recurring.jsx`
- Modify: `src/App.jsx`, `src/components/layout/Sidebar.jsx`, `src/pages/Transactions.jsx`

**Interfaces:**
- Consumes: `recurringRules`, `updateRecurringRule`, `deleteRecurringRule`, `fetchData`, `family`, `isLoading` from `useAppContext()`; `RecurringFields`, `AddExpenseModal` (`ruleMode`), `FREQUENCY_LABELS`.
- Produces: route `/recurring`.

- [ ] **Step 1: Create the edit modal**

Create `src/components/features/EditRuleModal.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { IndianRupee, FileText, Tag, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RecurringFields } from './RecurringFields';
import { useAppContext } from '../../context/useAppContext';
import { mergeCategories } from '../../utils/helpers';

export const EditRuleModal = ({ rule, onClose }) => {
  const { updateRecurringRule, fetchData, customCategories } = useAppContext();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const isExpense = rule ? rule.amount < 0 : true;

  useEffect(() => {
    if (!rule) return;
    setForm({
      title:     rule.title,
      amount:    String(Math.abs(rule.amount)),
      category:  rule.category,
      note:      rule.note || '',
      frequency: rule.frequency,
      endDate:   rule.end_date || '',
    });
  }, [rule]);

  if (!rule || !form) return null;

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const amountValue = parseFloat(form.amount);
  const canSave = form.title.trim() && amountValue > 0;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const ok = await updateRecurringRule(rule.id, {
      title:     form.title.trim(),
      amount:    isExpense ? -amountValue : amountValue,
      category:  form.category,
      note:      form.note.trim(),
      frequency: form.frequency,
      endDate:   form.endDate || null,
    });
    if (ok) { await fetchData(); onClose(); }
    setSaving(false);
  };

  return (
    <Modal isOpen={!!rule} onClose={onClose} title="Edit Recurring Rule">
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Description" icon={FileText} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        <Input
          label="Amount" icon={IndianRupee} type="number" step="0.01" min="0.01"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
            <Tag size={14} /> Category
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
            {mergeCategories(customCategories, isExpense ? 'expense' : 'income').list.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => set('category', cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  form.category === cat
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <RecurringFields frequency={form.frequency} endDate={form.endDate} onChange={set} />
        <textarea
          rows={2}
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || !canSave}>
            {saving ? <><Loader2 size={15} className="animate-spin mr-1.5" /> Saving…</> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
```

- [ ] **Step 2: Create the page**

Create `src/pages/Recurring.jsx`:

```jsx
import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Repeat } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AddExpenseModal } from '../components/features/AddExpenseModal';
import { EditRuleModal } from '../components/features/EditRuleModal';
import { useAppContext } from '../context/useAppContext';
import { FREQUENCY_LABELS } from '../utils/recurring';
import { formatDate } from '../utils/helpers';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const Recurring = () => {
  const { recurringRules, updateRecurringRule, deleteRecurringRule, fetchData, family, isLoading } = useAppContext();
  const [showAdd,      setShowAdd]      = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const memberName = (id) => {
    const m = family.find((f) => f.id === id);
    return m ? (m.user_name || m.name) : '';
  };

  const handleToggle = async (rule) => {
    const ok = await updateRecurringRule(rule.id, { isActive: !rule.is_active });
    if (ok) fetchData();
  };

  const askDelete = (rule) => setConfirmState({
    title:        'Delete recurring rule?',
    message:      `"${rule.title}" will stop creating transactions. Transactions already created are kept.`,
    confirmLabel: 'Delete',
    onConfirm:    () => deleteRecurringRule(rule.id),
  });

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Recurring</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Set it once — transactions are added automatically</p>
        </div>
        <Button variant="primary" className="gap-2 shrink-0" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add rule
        </Button>
      </header>

      {!isLoading && recurringRules.length === 0 && (
        <Card glass>
          <CardContent className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Repeat size={24} className="text-primary" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-semibold">No recurring rules yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Add rent, subscriptions or salary once and stop re-entering them.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {recurringRules.map((rule) => (
          <Card key={rule.id} glass>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{rule.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {FREQUENCY_LABELS[rule.frequency]} · {rule.category}
                  {memberName(rule.member_id) && ` · ${memberName(rule.member_id)}`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {rule.is_active ? `Next: ${formatDate(rule.next_due)}` : 'Paused'}
                  {rule.end_date && ` · ends ${formatDate(rule.end_date)}`}
                </p>
              </div>
              <p className={`font-bold shrink-0 ${rule.amount < 0 ? 'text-red-500' : 'text-secondary'}`}>
                {rule.amount < 0 ? '−' : '+'}₹{fmt(rule.amount)}
              </p>
              <Toggle checked={Boolean(rule.is_active)} onChange={() => handleToggle(rule)} aria-label={`Toggle ${rule.title}`} />
              <button type="button" aria-label={`Edit ${rule.title}`} onClick={() => setEditing(rule)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                <Pencil size={15} />
              </button>
              <button type="button" aria-label={`Delete ${rule.title}`} onClick={() => askDelete(rule)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <Trash2 size={15} />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddExpenseModal isOpen={showAdd} onClose={() => setShowAdd(false)} ruleMode />
      <EditRuleModal rule={editing} onClose={() => setEditing(null)} />
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
};
```

- [ ] **Step 3: Add the route, sidebar entry and Transactions link**

In `src/App.jsx` add `import { Recurring } from './pages/Recurring';` with the other page imports and, after the `/budgets` route:

```jsx
            <Route path="/recurring"    element={<Recurring />}    />
```

In `src/components/layout/Sidebar.jsx` add `Repeat` to the lucide import and, after the Budgets entry in `navItems`:

```js
  { name: 'Recurring',    path: '/recurring',    icon: Repeat          },
```

In `src/pages/Transactions.jsx` add `import { Link } from 'react-router-dom';` and, as the first child of the header's `<div className="flex gap-2 shrink-0">`:

```jsx
          <Link to="/recurring">
            <Button variant="glass" className="gap-2">
              <Repeat size={15} />
              <span className="hidden sm:inline">Recurring</span>
            </Button>
          </Link>
```

(`Repeat` is already imported there.)

- [ ] **Step 4: Verify**

Run: `npm run lint && npm run build`
Expected: no lint errors; build succeeds.

Browser pass (dev servers running, throwaway account):
1. Sidebar shows "Recurring"; the Transactions header also links to it on mobile width.
2. "Add rule" opens the modal titled "New Recurring Rule" with no recurring toggle; creating a weekly rule starting two weeks ago adds three transactions.
3. The rule row shows frequency, category, next due and amount; toggling off shows "Paused" and no new transactions appear after a reload; toggling on sets Next to a future date.
4. Edit changes the amount; the list updates and old transactions keep the old amount.
5. Delete asks for confirmation, removes the row, keeps the created transactions.
6. As a second throwaway Member account, the page lists only that member's rules.

- [ ] **Step 5: Commit (after the user confirms)**

```bash
git add src/components/features/EditRuleModal.jsx src/pages/Recurring.jsx src/App.jsx src/components/layout/Sidebar.jsx src/pages/Transactions.jsx
git commit -m "feat: add recurring rules page"
```

---

### Task 7: Documentation and final verification

**Files:**
- Modify: `.env.example`, `README.md`

- [ ] **Step 1: Document `CRON_SECRET`**

In `.env.example`, under the required secrets block, add:

```
# Protects /api/cron/*. Vercel sends it as a Bearer token on scheduled calls.
CRON_SECRET=replace_this_with_another_secure_random_string
```

In `README.md`, in the environment variable table next to `CSRF_SECRET` (around line 177), add a row:

```
| `CRON_SECRET` | Another long random secret; required for the daily recurring-transactions cron |
```

and, next to the example `.env` block (around line 144), add `CRON_SECRET=yet-another-long-random-string`.

- [ ] **Step 2: Full verification**

Run:

```bash
node --test server/recurringDates.test.js src/utils/budgetResolve.test.js
npm run lint
npm run build
```

Expected: all tests pass (`# fail 0`), lint clean, build succeeds.

- [ ] **Step 3: Re-run the Task 3 Step 9 script**

With the dev servers running (`CRON_SECRET=local-test-secret npm run dev`) and a fresh throwaway account, re-run the Task 3 browser script end to end.
Expected: the same results as before, confirming nothing regressed through the UI tasks.

- [ ] **Step 4: Production note for the user**

Report that `CRON_SECRET` must be added in the Vercel dashboard (any random string) before the cron can run in production, and that the first scheduled run happens at 00:05 UTC.

- [ ] **Step 5: Commit (after the user confirms)**

```bash
git add .env.example README.md
git commit -m "docs: document CRON_SECRET for the recurring cron"
```
