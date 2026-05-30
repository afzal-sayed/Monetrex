import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
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

app.use('/api', doubleCsrfProtection);

app.get('/api/csrf-token', (req, res) => res.json({ token: generateCsrfToken(req, res) }));
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

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

/* eslint-disable no-undef */
if (process.argv[1] === new URL(import.meta.url).pathname) {
  app.listen(PORT, () => {
    console.log(`\n  🚀 Monetrex API  →  http://localhost:${PORT}`);
  });
}
/* eslint-enable no-undef */

export default app;
