import { Router } from 'express';
import { db } from '../database.js';
import { genId } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.put('/:groupId/budgets', authenticate, (req, res) => {
  try {
    const { groupId } = req.params;
    const { budgets } = req.body;

    if (!budgets || typeof budgets !== 'object') {
      return res.status(400).json({ error: 'Invalid budgets payload' });
    }

    const membership = db.prepare(
      'SELECT role FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(groupId, req.userId);
    if (!membership || !['Owner', 'Admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Only admins can set budgets' });
    }

    const upsert = db.prepare(`
      INSERT INTO budgets (id, group_id, category, amount) VALUES (?, ?, ?, ?)
      ON CONFLICT(group_id, category) DO UPDATE SET amount = excluded.amount
    `);
    const remove = db.prepare('DELETE FROM budgets WHERE group_id = ? AND category = ?');

    const applyBudgets = db.transaction((entries) => {
      for (const [category, amount] of entries) {
        const num = parseFloat(amount);
        if (num > 0) upsert.run(genId(), groupId, category, num);
        else remove.run(groupId, category);
      }
    });

    applyBudgets(Object.entries(budgets));

    const saved = db.prepare('SELECT * FROM budgets WHERE group_id = ?').all(groupId);
    res.json({ budgets: saved });
  } catch (e) {
    console.error('Update budgets error:', e);
    res.status(500).json({ error: 'Failed to update budgets' });
  }
});

export default router;
