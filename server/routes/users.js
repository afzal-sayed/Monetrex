import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { safeUser } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: safeUser(user) });
});

router.patch('/', authenticate, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name            !== undefined) updates.name          = req.body.name.trim();
    if (req.body.email           !== undefined) updates.email         = req.body.email.toLowerCase().trim();
    if (req.body.notifications   !== undefined) updates.notifications = req.body.notifications ? 1 : 0;
    if (req.body.weeklyReport    !== undefined) updates.weekly_report = req.body.weeklyReport  ? 1 : 0;

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields provided' });

    const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    res.json({ user: safeUser(user) });
  } catch (e) {
    console.error('Update user error:', e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.userId);
    res.json({ ok: true });
  } catch (e) {
    console.error('Change password error:', e);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.delete('/', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete account error:', e);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
