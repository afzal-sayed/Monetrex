import { db } from './database.js';

export const genId  = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const genJti = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export const safeUser = (u) => {
  if (!u) return null;
  const { password_hash: _ph, ...rest } = u;
  return rest;
};

/**
 * Auto-create a personal group + owner membership for a user.
 * Used on signup and as a fallback in GET /api/data.
 * Returns the new groupId.
 */
export const createDefaultGroup = (userId, userName, userEmail) => {
  const groupId      = genId();
  const membershipId = genId();
  db.prepare('INSERT INTO groups_tbl (id, name, owner_id) VALUES (?, ?, ?)')
    .run(groupId, `${userName}'s Budget`, userId);
  db.prepare('INSERT INTO memberships (id, group_id, user_id, name, email, role) VALUES (?, ?, ?, ?, ?, ?)')
    .run(membershipId, groupId, userId, userName, userEmail, 'Owner');
  return groupId;
};
