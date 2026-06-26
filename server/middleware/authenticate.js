import jwt from 'jsonwebtoken';
import { query, run } from '../database.js';

/* eslint-disable no-undef */
const JWT_SECRET = process.env.JWT_SECRET;
/* eslint-enable no-undef */

export const authenticate = async (req, res, next) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    if (payload.jti) {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await run('DELETE FROM revoked_tokens WHERE revoked_at < $1', [cutoff]);
      const [revoked] = await query('SELECT 1 FROM revoked_tokens WHERE jti = $1', [payload.jti]);
      if (revoked) {
        return res.status(401).json({ error: 'Session has been revoked. Please log in again.' });
      }
    }

    req.userId = payload.userId;
    req.jti    = payload.jti;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};
