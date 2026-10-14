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
    // Guarded so a concurrent pause/resume/frequency edit wins; the engine only ever switches a rule off.
    await query(
      `UPDATE recurring_rules
       SET next_due = $1, is_active = CASE WHEN $2 = 0 THEN 0 ELSE is_active END
       WHERE id = $3 AND next_due = $4 AND frequency = $5`,
      [nextDue, stillActive ? 1 : 0, rule.id, rule.next_due, rule.frequency]
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
