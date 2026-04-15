import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database.js';
import { genId, safeUser, createDefaultGroup } from '../helpers.js';

/* eslint-disable no-undef */
const JWT_SECRET = process.env.JWT_SECRET;
/* eslint-enable no-undef */

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim())    return res.status(400).json({ error: 'Name is required' });
    if (!email?.trim())   return res.status(400).json({ error: 'Email is required' });
    if (!password)        return res.status(400).json({ error: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

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

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (e) {
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'No account found with this email' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error during login' });
  }
});

export default router;
