import express from 'express';
import cors from 'cors';
import authRoutes        from './routes/auth.js';
import userRoutes        from './routes/users.js';
import dataRoutes        from './routes/data.js';
import groupRoutes       from './routes/groups.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes      from './routes/budgets.js';

/* eslint-disable no-undef */
const PORT = process.env.PORT || 3001;
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
/* eslint-enable no-undef */

const app = express();
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use('/api/auth',         authRoutes);
app.use('/api/me',           userRoutes);
app.use('/api/data',         dataRoutes);
app.use('/api/groups',       groupRoutes);
app.use('/api',              transactionRoutes);
app.use('/api/groups',       budgetRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n  🚀 Monetrex API  →  http://localhost:${PORT}`);
});
