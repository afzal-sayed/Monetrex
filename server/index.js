import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './database.js';

const app = express();
/* eslint-disable no-undef */
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'monetrex_jwt_secret_dev_change_in_production';
/* eslint-enable no-undef */

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json());

// ─── Helpers ───────────────────────────────────────────────────────────────
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const safeUser = (u) => {
  if (!u) return null;
  const { password_hash: _ph, ...rest } = u;
  return rest;
};

// ─── Auth Middleware ────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

// ─── Auth Routes ────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!password)      return res.status(400).json({ error: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const emailLower = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const id = genId();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, avatar)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name.trim(), emailLower, passwordHash,
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=4F46E5&textColor=ffffff`);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    // Auto-create a personal group so the user can immediately add transactions
    const groupId = genId();
    const membershipId = genId();
    db.prepare(`INSERT INTO groups_tbl (id, name, owner_id) VALUES (?, ?, ?)`).run(groupId, `${name.trim()}'s Budget`, id);
    db.prepare(`INSERT INTO memberships (id, group_id, user_id, name, email, role) VALUES (?, ?, ?, ?, ?, ?)`).run(membershipId, groupId, id, name.trim(), emailLower, 'Owner');

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (e) {
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'No account found with this email' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ─── User Routes ────────────────────────────────────────────────────────────

app.get('/api/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: safeUser(user) });
});

app.patch('/api/me', authenticate, async (req, res) => {
  try {
    const updates = {};

    if (req.body.name      !== undefined) updates.name          = req.body.name.trim();
    if (req.body.email     !== undefined) updates.email         = req.body.email.toLowerCase().trim();
    if (req.body.notifications !== undefined) updates.notifications = req.body.notifications ? 1 : 0;
    if (req.body.weeklyReport  !== undefined) updates.weekly_report  = req.body.weeklyReport  ? 1 : 0;

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

app.post('/api/me/change-password', authenticate, async (req, res) => {
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

app.delete('/api/me', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete account error:', e);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ─── Data (combined fetch) ──────────────────────────────────────────────────

app.get('/api/data', authenticate, (req, res) => {
  try {
    const userMemberships = db.prepare(
      'SELECT group_id FROM memberships WHERE user_id = ?'
    ).all(req.userId);

    let groupIds = userMemberships.map(m => m.group_id);

    // Auto-create a personal group for users who signed up before this feature
    if (groupIds.length === 0) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
      const groupId = genId();
      const membershipId = genId();
      db.prepare(`INSERT INTO groups_tbl (id, name, owner_id) VALUES (?, ?, ?)`).run(groupId, `${user.name}'s Budget`, req.userId);
      db.prepare(`INSERT INTO memberships (id, group_id, user_id, name, email, role) VALUES (?, ?, ?, ?, ?, ?)`).run(membershipId, groupId, req.userId, user.name, user.email, 'Owner');
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

    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE group_id IN (${ph})
      ORDER BY date DESC, created_at DESC
    `).all(...groupIds);

    const budgets = db.prepare(
      `SELECT * FROM budgets WHERE group_id IN (${ph})`
    ).all(...groupIds);

    res.json({ groups, memberships, transactions, budgets });
  } catch (e) {
    console.error('Data fetch error:', e);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

// ─── Group Routes ───────────────────────────────────────────────────────────

app.post('/api/groups', authenticate, (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const groupId      = `g-${genId()}`;
    const membershipId = `m-${genId()}`;

    db.prepare('INSERT INTO groups_tbl (id, name, owner_id) VALUES (?, ?, ?)').run(groupId, name.trim(), req.userId);
    db.prepare(`
      INSERT INTO memberships (id, group_id, user_id, name, email, role, spend_limit)
      VALUES (?, ?, ?, ?, ?, 'Owner', NULL)
    `).run(membershipId, groupId, req.userId, user.name, user.email);

    const group      = db.prepare('SELECT * FROM groups_tbl WHERE id = ?').get(groupId);
    const membership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(membershipId);

    res.status(201).json({ group, membership });
  } catch (e) {
    console.error('Create group error:', e);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// ─── Member Routes ──────────────────────────────────────────────────────────

app.post('/api/groups/:groupId/members', authenticate, (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, email, role = 'Member', spendLimit } = req.body;

    if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: 'Name and email are required' });

    const requester = db.prepare(
      'SELECT role FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(groupId, req.userId);

    if (!requester || !['Owner', 'Admin'].includes(requester.role)) {
      return res.status(403).json({ error: 'Only admins can invite members' });
    }

    const emailLower = email.toLowerCase().trim();
    const alreadyMember = db.prepare(
      'SELECT id FROM memberships WHERE group_id = ? AND email = ?'
    ).get(groupId, emailLower);
    if (alreadyMember) return res.status(409).json({ error: 'This person is already a member' });

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    const membershipId = `m-${genId()}`;

    db.prepare(`
      INSERT INTO memberships (id, group_id, user_id, name, email, role, spend_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(membershipId, groupId, existingUser?.id || null, name.trim(), emailLower, role, spendLimit || null);

    const membership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(membershipId);
    res.status(201).json({ membership });
  } catch (e) {
    console.error('Add member error:', e);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove a member (Owner can remove anyone; Admin can remove Members only)
app.delete('/api/groups/:groupId/members/:memberId', authenticate, (req, res) => {
  try {
    const { groupId, memberId } = req.params;

    const requester = db.prepare(
      'SELECT role FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(groupId, req.userId);
    if (!requester || !['Owner', 'Admin'].includes(requester.role)) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    const target = db.prepare('SELECT * FROM memberships WHERE id = ? AND group_id = ?').get(memberId, groupId);
    if (!target) return res.status(404).json({ error: 'Member not found' });
    if (target.role === 'Owner') return res.status(403).json({ error: 'Cannot remove the group owner' });
    if (requester.role === 'Admin' && target.role === 'Admin') {
      return res.status(403).json({ error: 'Admins cannot remove other admins' });
    }

    db.prepare('DELETE FROM memberships WHERE id = ?').run(memberId);
    res.json({ ok: true });
  } catch (e) {
    console.error('Remove member error:', e);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Leave a group. If the requester is the Owner, the entire group is deleted.
app.delete('/api/groups/:groupId/leave', authenticate, (req, res) => {
  try {
    const { groupId } = req.params;

    const membership = db.prepare(
      'SELECT * FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(groupId, req.userId);
    if (!membership) return res.status(404).json({ error: 'You are not a member of this group' });

    if (membership.role === 'Owner') {
      // Delete everything belonging to the group
      db.prepare('DELETE FROM budgets      WHERE group_id = ?').run(groupId);
      db.prepare('DELETE FROM transactions WHERE group_id = ?').run(groupId);
      db.prepare('DELETE FROM memberships  WHERE group_id = ?').run(groupId);
      db.prepare('DELETE FROM groups_tbl   WHERE id = ?').run(groupId);
      return res.json({ ok: true, deleted: true });
    }

    db.prepare('DELETE FROM memberships WHERE id = ?').run(membership.id);
    res.json({ ok: true, deleted: false });
  } catch (e) {
    console.error('Leave group error:', e);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// ─── Transaction Routes ─────────────────────────────────────────────────────

app.post('/api/groups/:groupId/transactions', authenticate, (req, res) => {
  try {
    const { groupId } = req.params;
    const { title, amount, category, memberId, note, date, isRecurring } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (amount === undefined || amount === null) return res.status(400).json({ error: 'Amount is required' });
    if (!memberId) return res.status(400).json({ error: 'Member is required' });

    const isMember = db.prepare(
      'SELECT id FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(groupId, req.userId);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group' });

    const memberExists = db.prepare('SELECT id FROM memberships WHERE id = ? AND group_id = ?').get(memberId, groupId);
    if (!memberExists) return res.status(400).json({ error: 'Invalid member for this group' });

    const id = `t-${genId()}`;
    const txDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO transactions (id, group_id, member_id, title, amount, category, note, date, is_recurring)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, groupId, memberId, title.trim(), parseFloat(amount), category || 'General', note?.trim() || '', txDate, isRecurring ? 1 : 0);

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.status(201).json({ transaction });
  } catch (e) {
    console.error('Add transaction error:', e);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

app.patch('/api/transactions/:id', authenticate, (req, res) => {
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
    if (title      !== undefined) updates.title        = title.trim();
    if (amount     !== undefined) updates.amount       = parseFloat(amount);
    if (category   !== undefined) updates.category     = category;
    if (note       !== undefined) updates.note         = note?.trim() || '';
    if (date       !== undefined) updates.date         = date;
    if (isRecurring!== undefined) updates.is_recurring = isRecurring ? 1 : 0;
    if (memberId   !== undefined) updates.member_id    = memberId;

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

app.delete('/api/transactions/:id', authenticate, (req, res) => {
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

// ─── Budget Routes ──────────────────────────────────────────────────────────

app.put('/api/groups/:groupId/budgets', authenticate, (req, res) => {
  try {
    const { groupId } = req.params;
    const { budgets } = req.body; // { Food: 500, Transport: 200, ... }

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

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n  🚀 Monetrex API  →  http://localhost:${PORT}`);
});
