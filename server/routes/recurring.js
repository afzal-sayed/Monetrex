import { Router } from 'express';
import { query, run } from '../database.js';
import { genId } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';
import { processDueRules, listRulesForUser, utcToday } from '../recurring.js';
import { FREQUENCIES, addDays, isValidDate, nextOnOrAfter } from '../recurringDates.js';

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
    if (values.start_date < addDays(utcToday(), -365)) {
      return res.status(400).json({ error: 'Start date cannot be more than a year in the past' });
    }
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
