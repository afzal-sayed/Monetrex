import { Router } from 'express';
import { db } from '../database.js';
import { genId } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.post('/groups/:groupId/transactions', authenticate, (req, res) => {
  try {
    const { groupId } = req.params;
    const { title, amount, category, memberId, note, date, isRecurring } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (amount === undefined || amount === null) return res.status(400).json({ error: 'Amount is required' });
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount)) return res.status(400).json({ error: 'Amount must be a valid number' });
    if (!memberId) return res.status(400).json({ error: 'Member is required' });

    const isMember = db.prepare(
      'SELECT id FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(groupId, req.userId);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group' });

    const memberExists = db.prepare(
      'SELECT id FROM memberships WHERE id = ? AND group_id = ?'
    ).get(memberId, groupId);
    if (!memberExists) return res.status(400).json({ error: 'Invalid member for this group' });

    const id     = `t-${genId()}`;
    const txDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO transactions (id, group_id, member_id, title, amount, category, note, date, is_recurring)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, groupId, memberId, title.trim(), parsedAmount,
           category || 'General', note?.trim() || '', txDate, isRecurring ? 1 : 0);

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.status(201).json({ transaction });
  } catch (e) {
    console.error('Add transaction error:', e);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

router.patch('/transactions/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    const membership = db.prepare(
      'SELECT role, id AS membershipId FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(txn.group_id, req.userId);
    if (!membership) return res.status(403).json({ error: 'Not authorized' });

    const updates = {};
    const { title, amount, category, note, date, isRecurring, memberId } = req.body;
    if (title       !== undefined) updates.title        = title.trim();
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (!Number.isFinite(parsedAmount)) return res.status(400).json({ error: 'Amount must be a valid number' });
      updates.amount = parsedAmount;
    }
    if (category    !== undefined) updates.category     = category;
    if (note        !== undefined) updates.note         = note?.trim() || '';
    if (date        !== undefined) updates.date         = date;
    if (isRecurring !== undefined) updates.is_recurring = isRecurring ? 1 : 0;
    if (memberId !== undefined) {
      const memberInGroup = db.prepare('SELECT id FROM memberships WHERE id = ? AND group_id = ?').get(memberId, txn.group_id);
      if (!memberInGroup) return res.status(400).json({ error: 'Member does not belong to this group' });
      updates.member_id = memberId;
    }

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No updates provided' });

    const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE transactions SET ${setClause} WHERE id = ?`).run(...Object.values(updates), id);

    const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.json({ transaction: updated });
  } catch (e) {
    console.error('Update transaction error:', e);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/transactions/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    const membership = db.prepare(
      'SELECT role, id AS membershipId FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(txn.group_id, req.userId);
    if (!membership) return res.status(403).json({ error: 'Not authorized' });

    const isAdmin = ['Owner', 'Admin'].includes(membership.role);
    if (!isAdmin && txn.member_id !== membership.membershipId) {
      return res.status(403).json({ error: 'You can only delete your own transactions' });
    }

    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete transaction error:', e);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
