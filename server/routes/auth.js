import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import { db } from '../database.js';
import { genId, genJti, safeUser, createDefaultGroup } from '../helpers.js';

/* eslint-disable no-undef */
const JWT_SECRET = process.env.JWT_SECRET;
/* eslint-enable no-undef */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

/* eslint-disable no-undef */
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};
/* eslint-enable no-undef */

const signToken = (userId) => {
  const jti = genJti();
  const token = jwt.sign({ userId, jti }, JWT_SECRET, { expiresIn: '7d' });
  return { token, jti };
};

const router = Router();

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!isValidEmail(email.trim())) return res.status(400).json({ error: 'Enter a valid email address' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const emailLower = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const id = genId();

    db.prepare('INSERT INTO users (id, name, email, password_hash, avatar) VALUES (?, ?, ?, ?, ?)')
      .run(id, name.trim(), emailLower, passwordHash,
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=4F46E5&textColor=ffffff`);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    createDefaultGroup(id, name.trim(), emailLower);

    const { token } = signToken(id);
    res.cookie('token', token, COOKIE_OPTS);
    res.status(201).json({ user: safeUser(user) });
  } catch (e) {
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'No account found with this email' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const { token } = signToken(user.id);
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ user: safeUser(user) });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.post('/logout', authLimiter, (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.jti) {
        db.prepare('INSERT OR IGNORE INTO revoked_tokens (jti, revoked_at) VALUES (?, ?)')
          .run(payload.jti, new Date().toISOString());
      }
    } catch { /* expired token — still clear the cookie */ }
  }
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ ok: true });
});

// ── Forgot / Reset Password ──────────────────────────────────────────────────

router.post('/forgot-password', authLimiter, (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    // Always return 200 to prevent email enumeration
    if (!user) return res.json({ ok: true, _dev_note: 'No account found, but we return 200 to prevent enumeration.' });

    // Remove any existing token for this user
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    db.prepare('INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)')
      .run(resetToken, user.id, expiresAt);

    // In production this token would be emailed. Here we return it directly.
    res.json({
      ok: true,
      resetToken,
      _dev_note: 'In production this token would be sent via email. Returning it directly for development.',
    });
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token);
    if (!row) return res.status(400).json({ error: 'Invalid or expired reset token' });

    if (new Date(row.expires_at) < new Date()) {
      db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token);
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
    db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token);

    res.json({ ok: true });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
