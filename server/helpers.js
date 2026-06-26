import { randomUUID } from 'crypto';
import { run } from './database.js';

export const genId  = () => randomUUID();
export const genJti = () => randomUUID();

export const PASSWORD_RULES = {
  minLength:   { test: (p) => p.length >= 8,               message: 'At least 8 characters' },
  uppercase:   { test: (p) => /[A-Z]/.test(p),             message: 'At least one uppercase letter' },
  number:      { test: (p) => /[0-9]/.test(p),             message: 'At least one number' },
  specialChar: { test: (p) => /[^A-Za-z0-9]/.test(p),     message: 'At least one special character' },
};

export const validatePassword = (password) => {
  const failures = Object.values(PASSWORD_RULES).filter(r => !r.test(password));
  if (failures.length === 0) return null;
  return failures.map(r => r.message).join(', ');
};

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
