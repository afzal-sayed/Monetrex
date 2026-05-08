import jwt from 'jsonwebtoken';
import { db } from '../database.js';

/* eslint-disable no-undef */
const JWT_SECRET = process.env.JWT_SECRET;
/* eslint-enable no-undef */

export const authenticate = (req, res, next) => {
  // Prefer HttpOnly cookie; fall back to Bearer header for API clients
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

    // JTI blocklist check — prune expired revocations inline (cheap, synchronous)
    if (payload.jti) {
      db.prepare("DELETE FROM revoked_tokens WHERE revoked_at < datetime('now', '-7 days')").run();
      const revoked = db.prepare('SELECT 1 FROM revoked_tokens WHERE jti = ?').get(payload.jti);
      if (revoked) {
        return res.status(401).json({ error: 'Session has been revoked. Please log in again.' });
      }
    }

    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};
