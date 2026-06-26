import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { query, run } from '../database.js';
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
    if (password.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters' });

    const emailLower = email.toLowerCase().trim();
    const [existing] = await query('SELECT id FROM users WHERE email = $1', [emailLower]);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const id = genId();
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=4F46E5&textColor=ffffff`;

    await run(
      'INSERT INTO users (id, name, email, password_hash, avatar) VALUES ($1, $2, $3, $4, $5)',
      [id, name.trim(), emailLower, passwordHash, avatar]
    );

    const [user] = await query('SELECT * FROM users WHERE id = $1', [id]);
    await createDefaultGroup(id, name.trim(), emailLower);

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

    const [user] = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
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

router.post('/logout', authLimiter, async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      if (payload.jti) {
        await run(
          'INSERT INTO revoked_tokens (jti, revoked_at) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [payload.jti, new Date().toISOString()]
        );
      }
    } catch { /* expired token — still clear the cookie */ }
  }
  const { maxAge: _ignored, ...clearOpts } = COOKIE_OPTS;
  res.clearCookie('token', clearOpts);
  res.json({ ok: true });
});

router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const [user] = await query('SELECT id, email FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user) return res.json({ ok: true });

    await run('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    const resetToken     = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const expiresAt      = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await run(
      'INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [resetTokenHash, user.id, expiresAt]
    );

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
    if (newPassword.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters' });

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const [row] = await query('SELECT * FROM password_reset_tokens WHERE token = $1', [tokenHash]);
    if (!row) return res.status(400).json({ error: 'Invalid or expired reset token' });

    if (new Date(row.expires_at) < new Date()) {
      await run('DELETE FROM password_reset_tokens WHERE token = $1', [tokenHash]);
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await run('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, row.user_id]);
    await run('DELETE FROM password_reset_tokens WHERE token = $1', [tokenHash]);

    res.json({ ok: true });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
