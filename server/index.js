import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { spawn } from 'child_process';
import { DB_PATH } from './database.js';
import authRoutes        from './routes/auth.js';
import userRoutes        from './routes/users.js';
import dataRoutes        from './routes/data.js';
import groupRoutes       from './routes/groups.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes      from './routes/budgets.js';

/* eslint-disable no-undef */
const PORT       = process.env.PORT || 3001;
const IS_PROD    = process.env.NODE_ENV === 'production';
if (!process.env.JWT_SECRET)  throw new Error('JWT_SECRET environment variable is required');
if (!process.env.CSRF_SECRET) throw new Error('CSRF_SECRET environment variable is required');
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
/* eslint-enable no-undef */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const adminDownloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin download requests. Please try again later.' },
});

/* eslint-disable no-undef */
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret:            () => process.env.CSRF_SECRET,
  getSessionIdentifier: () => '',
  cookieName:    'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: IS_PROD ? 'none' : 'lax',
    secure:   IS_PROD,
    path:     '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});
/* eslint-enable no-undef */


const app = express();
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/api', apiLimiter);

const csrfBypassForSafeEndpoints = (req, res, next) => {
  if (
    req.method === 'GET' &&
    (req.path === '/csrf-token' || req.path === '/health')
  ) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
};

app.use('/api', csrfBypassForSafeEndpoints);

app.get('/api/csrf-token', (req, res) => res.json({ token: generateCsrfToken(req, res) }));
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

/* eslint-disable no-undef */
app.get('/admin/download-db', adminDownloadLimiter, (req, res, next) => {
  if (req.method === 'GET') return next();
  return doubleCsrfProtection(req, res, next);
}, (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || req.body?.secret !== adminSecret) return res.status(403).send('Forbidden');
  const dataDir = dirname(DB_PATH);
  if (!existsSync(dataDir)) return res.status(404).send('Data directory not found');
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', 'attachment; filename="monetrex-data.tar.gz"');
  const tar = spawn('tar', ['czf', '-', '-C', dataDir, '.']);
  tar.stdout.pipe(res);
  tar.stderr.on('data', d => console.error('tar:', d.toString()));
  tar.on('error', err => { console.error('tar error:', err); res.destroy(); });
});
/* eslint-enable no-undef */


app.use('/api/auth',         authRoutes);
app.use('/api/me',           userRoutes);
app.use('/api/data',         dataRoutes);
app.use('/api/groups',       groupRoutes);
app.use('/api',              transactionRoutes);
app.use('/api/groups',       budgetRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n  🚀 Monetrex API  →  http://localhost:${PORT}`);
});
