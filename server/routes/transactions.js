import { Router } from 'express';
import { query, run } from '../database.js';
import { genId } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.post('/groups/:groupId/transactions', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { title, amount, category, memberId, note, date, isRecurring } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (title.trim().length > 200) return res.status(400).json({ error: 'Title must be 200 characters or fewer' });
    if (note && note.length > 500) return res.status(400).json({ error: 'Note must be 500 characters or fewer' });
    if (amount === undefined || amount === null) return res.status(400).json({ error: 'Amount is required' });
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount)) return res.status(400).json({ error: 'Amount must be a valid number' });
    if (!memberId) return res.status(400).json({ error: 'Member is required' });

    const [isMember] = await query(
      'SELECT id FROM memberships WHERE group_id = $1 AND user_id = $2',
      [groupId, req.userId]
    );
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group' });

    const [memberExists] = await query(
      'SELECT id FROM memberships WHERE id = $1 AND group_id = $2',
      [memberId, groupId]
    );
    if (!memberExists) return res.status(400).json({ error: 'Invalid member for this group' });

    const id     = `t-${genId()}`;
    const txDate = date || new Date().toISOString().split('T')[0];

    await run(
      `INSERT INTO transactions (id, group_id, member_id, title, amount, category, note, date, is_recurring)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, groupId, memberId, title.trim(), parsedAmount, category || 'General', note?.trim() || '', txDate, isRecurring ? 1 : 0]
    );

    const [transaction] = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    res.status(201).json({ transaction });
  } catch (e) {
    console.error('Add transaction error:', e);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

router.patch('/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [txn] = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    const [membership] = await query(
      'SELECT role, id AS membershipId FROM memberships WHERE group_id = $1 AND user_id = $2',
      [txn.group_id, req.userId]
    );
    if (!membership) return res.status(403).json({ error: 'Not authorized' });

    const updates = {};
    const { title, amount, category, note, date, isRecurring, memberId } = req.body;
    if (title !== undefined) {
      if (title.trim().length > 200) return res.status(400).json({ error: 'Title must be 200 characters or fewer' });
      updates.title = title.trim();
    }
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (!Number.isFinite(parsedAmount)) return res.status(400).json({ error: 'Amount must be a valid number' });
      updates.amount = parsedAmount;
    }
    if (category    !== undefined) updates.category     = category;
    if (note !== undefined) {
      if (note && note.length > 500) return res.status(400).json({ error: 'Note must be 500 characters or fewer' });
      updates.note = note?.trim() || '';
    }
    if (date        !== undefined) updates.date         = date;
    if (isRecurring !== undefined) updates.is_recurring = isRecurring ? 1 : 0;
    if (memberId !== undefined) {
      const [memberInGroup] = await query(
        'SELECT id FROM memberships WHERE id = $1 AND group_id = $2',
        [memberId, txn.group_id]
      );
      if (!memberInGroup) return res.status(400).json({ error: 'Member does not belong to this group' });
      updates.member_id = memberId;
    }

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No updates provided' });

    const keys      = Object.keys(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    await run(
      `UPDATE transactions SET ${setClause} WHERE id = $${keys.length + 1}`,
      [...Object.values(updates), id]
    );

    const [updated] = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    res.json({ transaction: updated });
  } catch (e) {
    console.error('Update transaction error:', e);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Bulk delete — body: { ids: ['id1', 'id2', ...] }
router.delete('/transactions/bulk', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
      return res.status(400).json({ error: 'ids must be a non-empty array of at most 500 items' });
    }

    const rows = await query(
      `SELECT t.id, t.group_id, t.member_id
       FROM transactions t
       WHERE t.id = ANY($1)`,
      [ids]
    );
    if (rows.length === 0) return res.json({ deleted: 0 });

    const groupIds = [...new Set(rows.map((r) => r.group_id))];

    const memberships = await query(
      `SELECT group_id, role, id as member_id FROM memberships WHERE user_id = $1 AND group_id = ANY($2)`,
      [req.userId, groupIds]
    );
    const roleMap = {};
    const userMemberIds = new Set();
    memberships.forEach((m) => {
      roleMap[m.group_id] = m.role;
      userMemberIds.add(m.member_id);
    });

    const allowedIds = rows
      .filter((r) => {
        const role = roleMap[r.group_id];
        return role === 'Owner' || role === 'Admin' || userMemberIds.has(r.member_id);
      })
      .map((r) => r.id);

    if (allowedIds.length === 0) return res.json({ deleted: 0 });

    await run(`DELETE FROM transactions WHERE id = ANY($1)`, [allowedIds]);
    res.json({ deleted: allowedIds.length });
  } catch (e) {
    console.error('Bulk delete transaction error:', e);
    res.status(500).json({ error: 'Failed to bulk delete transactions' });
  }
});

router.delete('/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [txn] = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    const [membership] = await query(
      'SELECT role, id AS membershipId FROM memberships WHERE group_id = $1 AND user_id = $2',
      [txn.group_id, req.userId]
    );
    if (!membership) return res.status(403).json({ error: 'Not authorized' });

    const isAdmin = ['Owner', 'Admin'].includes(membership.role);
    if (!isAdmin && txn.member_id !== membership.membershipid) {
      return res.status(403).json({ error: 'You can only delete your own transactions' });
    }

    await run('DELETE FROM transactions WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete transaction error:', e);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
