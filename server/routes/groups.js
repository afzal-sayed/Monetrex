import { Router } from 'express';
import { db } from '../database.js';
import { genId } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// ─── Groups ──────────────────────────────────────────────────────────────────

router.post('/', authenticate, (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });
    if (name.trim().length > 100) return res.status(400).json({ error: 'Group name must be 100 characters or fewer' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const groupId      = `g-${genId()}`;
    const membershipId = `m-${genId()}`;

    db.prepare('INSERT INTO groups_tbl (id, name, owner_id) VALUES (?, ?, ?)')
      .run(groupId, name.trim(), req.userId);
    db.prepare(`INSERT INTO memberships (id, group_id, user_id, name, email, role, spend_limit) VALUES (?, ?, ?, ?, ?, 'Owner', NULL)`)
      .run(membershipId, groupId, req.userId, user.name, user.email);

    const group      = db.prepare('SELECT * FROM groups_tbl WHERE id = ?').get(groupId);
    const membership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(membershipId);

    res.status(201).json({ group, membership });
  } catch (e) {
    console.error('Create group error:', e);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.patch('/:groupId', authenticate, (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });
    if (name.trim().length > 100) return res.status(400).json({ error: 'Group name must be 100 characters or fewer' });

    const membership = db.prepare(
      'SELECT role FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(groupId, req.userId);
    if (!membership || !['Owner', 'Admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Only admins can rename the group' });
    }

    db.prepare('UPDATE groups_tbl SET name = ? WHERE id = ?').run(name.trim(), groupId);
    const group = db.prepare('SELECT * FROM groups_tbl WHERE id = ?').get(groupId);
    res.json({ group });
  } catch (e) {
    console.error('Rename group error:', e);
    res.status(500).json({ error: 'Failed to rename group' });
  }
});

// Leave a group. Owner leaving deletes the entire group.
router.delete('/:groupId/leave', authenticate, (req, res) => {
  try {
    const { groupId } = req.params;

    const membership = db.prepare(
      'SELECT * FROM memberships WHERE group_id = ? AND user_id = ?'
    ).get(groupId, req.userId);
    if (!membership) return res.status(404).json({ error: 'You are not a member of this group' });

    if (membership.role === 'Owner') {
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

// ─── Members ──────────────────────────────────────────────────────────────────

router.post('/:groupId/members', authenticate, (req, res) => {
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

    // Admins cannot assign the Owner role
    if (requester.role === 'Admin' && role === 'Owner') {
      return res.status(403).json({ error: 'Admins cannot assign the Owner role' });
    }

    const emailLower = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLower)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    const alreadyMember = db.prepare(
      'SELECT id FROM memberships WHERE group_id = ? AND email = ?'
    ).get(groupId, emailLower);
    if (alreadyMember) return res.status(409).json({ error: 'This person is already a member' });

    const existingUser  = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    const membershipId  = `m-${genId()}`;

    db.prepare('INSERT INTO memberships (id, group_id, user_id, name, email, role, spend_limit) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(membershipId, groupId, existingUser?.id || null, name.trim(), emailLower, role, spendLimit || null);

    const membership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(membershipId);
    res.status(201).json({ membership });
  } catch (e) {
    console.error('Add member error:', e);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Owner can remove anyone; Admin can remove Members only
router.delete('/:groupId/members/:memberId', authenticate, (req, res) => {
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

export default router;
