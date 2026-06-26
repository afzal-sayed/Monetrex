import { Router } from 'express';
import { query, run } from '../database.js';
import { genId } from '../helpers.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });
    if (name.trim().length > 100) return res.status(400).json({ error: 'Group name must be 100 characters or fewer' });

    const [user] = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const groupId      = `g-${genId()}`;
    const membershipId = `m-${genId()}`;

    await run(
      'INSERT INTO groups_tbl (id, name, owner_id) VALUES ($1, $2, $3)',
      [groupId, name.trim(), req.userId]
    );
    await run(
      `INSERT INTO memberships (id, group_id, user_id, name, email, role, spend_limit) VALUES ($1, $2, $3, $4, $5, 'Owner', NULL)`,
      [membershipId, groupId, req.userId, user.name, user.email]
    );

    const [group]      = await query('SELECT * FROM groups_tbl WHERE id = $1', [groupId]);
    const [membership] = await query('SELECT * FROM memberships WHERE id = $1', [membershipId]);

    res.status(201).json({ group, membership });
  } catch (e) {
    console.error('Create group error:', e);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.patch('/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });
    if (name.trim().length > 100) return res.status(400).json({ error: 'Group name must be 100 characters or fewer' });

    const [membership] = await query(
      'SELECT role FROM memberships WHERE group_id = $1 AND user_id = $2',
      [groupId, req.userId]
    );
    if (!membership || !['Owner', 'Admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Only admins can rename the group' });
    }

    await run('UPDATE groups_tbl SET name = $1 WHERE id = $2', [name.trim(), groupId]);
    const [group] = await query('SELECT * FROM groups_tbl WHERE id = $1', [groupId]);
    res.json({ group });
  } catch (e) {
    console.error('Rename group error:', e);
    res.status(500).json({ error: 'Failed to rename group' });
  }
});

router.delete('/:groupId/leave', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;

    const [membership] = await query(
      'SELECT * FROM memberships WHERE group_id = $1 AND user_id = $2',
      [groupId, req.userId]
    );
    if (!membership) return res.status(404).json({ error: 'You are not a member of this group' });

    if (membership.role === 'Owner') {
      await run('DELETE FROM budgets      WHERE group_id = $1', [groupId]);
      await run('DELETE FROM transactions WHERE group_id = $1', [groupId]);
      await run('DELETE FROM memberships  WHERE group_id = $1', [groupId]);
      await run('DELETE FROM groups_tbl   WHERE id = $1',       [groupId]);
      return res.json({ ok: true, deleted: true });
    }

    await run('DELETE FROM memberships WHERE id = $1', [membership.id]);
    res.json({ ok: true, deleted: false });
  } catch (e) {
    console.error('Leave group error:', e);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

router.post('/:groupId/members', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, email, role = 'Member', spendLimit } = req.body;

    if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: 'Name and email are required' });

    const [requester] = await query(
      'SELECT role FROM memberships WHERE group_id = $1 AND user_id = $2',
      [groupId, req.userId]
    );
    if (!requester || !['Owner', 'Admin'].includes(requester.role)) {
      return res.status(403).json({ error: 'Only admins can invite members' });
    }

    if (requester.role === 'Admin' && role === 'Owner') {
      return res.status(403).json({ error: 'Admins cannot assign the Owner role' });
    }

    const emailLower = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLower)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const [alreadyMember] = await query(
      'SELECT id FROM memberships WHERE group_id = $1 AND email = $2',
      [groupId, emailLower]
    );
    if (alreadyMember) return res.status(409).json({ error: 'This person is already a member' });

    let parsedSpendLimit = null;
    if (spendLimit !== undefined && spendLimit !== null && spendLimit !== '') {
      parsedSpendLimit = parseFloat(spendLimit);
      if (!Number.isFinite(parsedSpendLimit) || parsedSpendLimit <= 0 || parsedSpendLimit > 10_000_000) {
        return res.status(400).json({ error: 'Spend limit must be a positive number up to 10,000,000' });
      }
    }

    const [existingUser] = await query('SELECT id FROM users WHERE email = $1', [emailLower]);
    const membershipId   = `m-${genId()}`;

    await run(
      'INSERT INTO memberships (id, group_id, user_id, name, email, role, spend_limit) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [membershipId, groupId, existingUser?.id || null, name.trim(), emailLower, role, parsedSpendLimit]
    );

    const [membership] = await query('SELECT * FROM memberships WHERE id = $1', [membershipId]);
    res.status(201).json({ membership });
  } catch (e) {
    console.error('Add member error:', e);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:groupId/members/:memberId', authenticate, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;

    const [requester] = await query(
      'SELECT role FROM memberships WHERE group_id = $1 AND user_id = $2',
      [groupId, req.userId]
    );
    if (!requester || !['Owner', 'Admin'].includes(requester.role)) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    const [target] = await query(
      'SELECT * FROM memberships WHERE id = $1 AND group_id = $2',
      [memberId, groupId]
    );
    if (!target) return res.status(404).json({ error: 'Member not found' });
    if (target.role === 'Owner') return res.status(403).json({ error: 'Cannot remove the group owner' });
    if (requester.role === 'Admin' && target.role === 'Admin') {
      return res.status(403).json({ error: 'Admins cannot remove other admins' });
    }

    await run('DELETE FROM memberships WHERE id = $1', [memberId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Remove member error:', e);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;
