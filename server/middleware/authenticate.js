import jwt from 'jsonwebtoken';

/* eslint-disable no-undef */
const JWT_SECRET = process.env.JWT_SECRET;
/* eslint-enable no-undef */

export const authenticate = (req, res, next) => {
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
