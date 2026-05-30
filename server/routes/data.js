import { Router } from 'express';
import { query } from '../database.js';
import { createDefaultGroup } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const membershipRows = await query(
      'SELECT group_id FROM memberships WHERE user_id = $1',
      [req.userId]
    );

    let groupIds = membershipRows.map(m => m.group_id);

    if (groupIds.length === 0) {
      const [user] = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
      const groupId = await createDefaultGroup(req.userId, user.name, user.email);
      groupIds = [groupId];
    }

    const groups = await query(
      'SELECT * FROM groups_tbl WHERE id = ANY($1)',
      [groupIds]
    );

    const memberships = await query(`
      SELECT m.*, u.name AS user_name, u.avatar AS user_avatar
      FROM memberships m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.group_id = ANY($1)
    `, [groupIds]);

    const months  = parseInt(req.query.months, 10);
    const useAll  = !months || months <= 0 || months >= 999;

    let transactions;
    if (useAll) {
      transactions = await query(
        'SELECT * FROM transactions WHERE group_id = ANY($1) ORDER BY date DESC, created_at DESC',
        [groupIds]
      );
    } else {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      transactions = await query(
        'SELECT * FROM transactions WHERE group_id = ANY($1) AND date >= $2 ORDER BY date DESC, created_at DESC',
        [groupIds, cutoffStr]
      );
    }

    const budgets = await query(
      'SELECT * FROM budgets WHERE group_id = ANY($1)',
      [groupIds]
    );

    res.json({ groups, memberships, transactions, budgets });
  } catch (e) {
    console.error('Data fetch error:', e);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

export default router;
