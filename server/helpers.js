import { randomUUID } from 'crypto';
import { run } from './database.js';

export const genId  = () => randomUUID();
export const genJti = () => randomUUID();

export const safeUser = (u) => {
  if (!u) return null;
  const { password_hash: _ph, ...rest } = u;
  return rest;
};

export const createDefaultGroup = async (userId, userName, userEmail) => {
  const groupId      = genId();
  const membershipId = genId();
  await run(
    'INSERT INTO groups_tbl (id, name, owner_id) VALUES ($1, $2, $3)',
    [groupId, `${userName}'s Budget`, userId]
  );
  await run(
    'INSERT INTO memberships (id, group_id, user_id, name, email, role) VALUES ($1, $2, $3, $4, $5, $6)',
    [membershipId, groupId, userId, userName, userEmail, 'Owner']
  );
  return groupId;
};
