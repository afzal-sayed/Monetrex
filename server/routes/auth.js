import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { db } from '../database.js';
import { genId, genJti, safeUser, createDefaultGroup } from '../helpers.js';

/* eslint-disable no-undef */
const JWT_SECRET = process.env.JWT_SECRET;
const IS_PROD    = process.env.NODE_ENV === 'production';
const resend     = IS_PROD && process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@monetrex.app';
const APP_URL    = process.env.APP_URL || 'http://localhost:5173';
/* eslint-enable no-undef */
const DUMMY_HASH = bcrypt.hashSync('__dummy_timing__', 12);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: IS_PROD ? 'none' : 'lax',
  path:     '/',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

const signToken = (userId) => {
  const jti   = genJti();
  const token = jwt.sign({ userId, jti }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
  return { token, jti };
};

const router = Router();

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (name.trim().length > 100) return res.status(400).json({ error: 'Name must be 100 characters or fewer' });
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!isValidEmail(email.trim())) return res.status(400).json({ error: 'Enter a valid email address' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const emailLower = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const id = genId();

    db.prepare('INSERT INTO users (id, name, email, password_hash, avatar) VALUES (?, ?, ?, ?, ?)')
      .run(id, name.trim(), emailLower, passwordHash,
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=4F46E5&textColor=ffffff`);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    createDefaultGroup(id, name.trim(), emailLower);

    const { token } = signToken(id);
    res.cookie('token', token, COOKIE_OPTS);
    res.status(201).json({ user: safeUser(user), token });
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
    const valid = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !valid) return res.status(401).json({ error: 'Email or password is incorrect' });

    const { token } = signToken(user.id);
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ user: safeUser(user), token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.post('/logout', authLimiter, (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      if (payload.jti) {
        db.prepare('INSERT OR IGNORE INTO revoked_tokens (jti, revoked_at) VALUES (?, ?)')
          .run(payload.jti, new Date().toISOString());
      }
    } catch { /* expired token — still clear the cookie */ }
  }
  const { maxAge: _ignored, ...clearOpts } = COOKIE_OPTS;
  res.clearCookie('token', clearOpts);
  res.json({ ok: true });
});

// ── Forgot / Reset Password ──────────────────────────────────────────────────

router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
    // Always return 200 to prevent email enumeration
    if (!user) return res.json({ ok: true });

    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

    const resetToken     = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const expiresAt      = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)')
      .run(resetTokenHash, user.id, expiresAt);

    const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;

    if (resend) {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      user.email,
        subject: 'Reset your Monetrex password',
        html: `
          <p>You requested a password reset for your Monetrex account.</p>
          <p>Click the link below to reset your password. It expires in 1 hour.</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    } else {
      console.log(`[DEV] Password reset link for ${user.email}: ${resetLink}`);
    }

    res.json({ ok: true });
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

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(tokenHash);
    if (!row) return res.status(400).json({ error: 'Invalid or expired reset token' });

    if (new Date(row.expires_at) < new Date()) {
      db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(tokenHash);
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
    db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(tokenHash);

    res.json({ ok: true });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
