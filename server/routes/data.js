import { Router } from 'express';
import { db } from '../database.js';
import { createDefaultGroup } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Combined fetch — returns everything the frontend needs in one round trip
router.get('/', authenticate, (req, res) => {
  try {
    const userMemberships = db.prepare(
      'SELECT group_id FROM memberships WHERE user_id = ?'
    ).all(req.userId);

    let groupIds = userMemberships.map(m => m.group_id);

    // Fallback for users who existed before the groups feature
    if (groupIds.length === 0) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
      const groupId = createDefaultGroup(req.userId, user.name, user.email);
      groupIds = [groupId];
    }

    const ph = groupIds.map(() => '?').join(',');

    const groups = db.prepare(
      `SELECT * FROM groups_tbl WHERE id IN (${ph})`
    ).all(...groupIds);

    const memberships = db.prepare(`
      SELECT m.*, u.name AS user_name, u.avatar AS user_avatar
      FROM memberships m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.group_id IN (${ph})
    `).all(...groupIds);

    const months = parseInt(req.query.months, 10);
    const useAll = !months || months <= 0 || months >= 999;

    const transactions = useAll
      ? db.prepare(
          `SELECT * FROM transactions WHERE group_id IN (${ph}) ORDER BY date DESC, created_at DESC`
        ).all(...groupIds)
      : db.prepare(
          `SELECT * FROM transactions WHERE group_id IN (${ph}) AND date >= date('now', '-' || ? || ' months') ORDER BY date DESC, created_at DESC`
        ).all(...groupIds, months);

    const budgets = db.prepare(
      `SELECT * FROM budgets WHERE group_id IN (${ph})`
    ).all(...groupIds);

    res.json({ groups, memberships, transactions, budgets });
  } catch (e) {
    console.error('Data fetch error:', e);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

export default router;
