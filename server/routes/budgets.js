import { Router } from 'express';
import { query, run } from '../database.js';
import { genId } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.put('/:groupId/budgets', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { budgets, month = 'default' } = req.body;

    if (!budgets || typeof budgets !== 'object') {
      return res.status(400).json({ error: 'Invalid budgets payload' });
    }

    const [membership] = await query(
      'SELECT role FROM memberships WHERE group_id = $1 AND user_id = $2',
      [groupId, req.userId]
    );
    if (!membership || !['Owner', 'Admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Only admins can set budgets' });
    }

    for (const [category, amount] of Object.entries(budgets)) {
      const num = parseFloat(amount);
      if (num > 0) {
        await run(
          `INSERT INTO budgets (id, group_id, category, month, amount) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (group_id, category, month) DO UPDATE SET amount = EXCLUDED.amount`,
          [genId(), groupId, category, month, num]
        );
      } else {
        await run(
          'DELETE FROM budgets WHERE group_id = $1 AND category = $2 AND month = $3',
          [groupId, category, month]
        );
      }
    }

    const saved = await query(
      'SELECT * FROM budgets WHERE group_id = $1 AND month = $2',
      [groupId, month]
    );
    res.json({ budgets: saved });
  } catch (e) {
    console.error('Update budgets error:', e);
    res.status(500).json({ error: 'Failed to update budgets' });
  }
});

export default router;
