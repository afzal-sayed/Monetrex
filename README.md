# Monetrex

A collaborative family expense tracker with role-based access control, group budgets, and spending analytics.

**Live:** https://monetrex.vercel.app

## Features

- Track income and expenses across shared family/group budgets
- Role-based access: Owner, Admin, Member (admins see all transactions; members see their own)
- 6-month spending charts, category breakdowns, and smart insights
- Budget goals per category with progress tracking
- Invite family members to groups by email
- Password reset via email (Resend)
- CSV / JSON data export
- Dark mode

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Recharts |
| Backend | Express.js (Node.js), served as Vercel serverless function |
| Database | PostgreSQL via Supabase (free tier) |
| Auth | JWT (7-day expiry) + bcrypt + CSRF double-submit cookie |
| Hosting | Vercel (frontend + backend on one domain) |
| Email | Resend (optional — for password reset) |

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/afzal-sayed/Monetrex.git
cd Monetrex
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema below to create all tables
3. Go to **Settings → Database → Connection pooling** and copy the **Session mode URI** (port 5432)

<details>
<summary>Database Schema (click to expand)</summary>

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  notifications INTEGER DEFAULT 1,
  weekly_report INTEGER DEFAULT 0,
  created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE IF NOT EXISTS groups_tbl (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Member',
  spend_limit REAL,
  created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  FOREIGN KEY (group_id) REFERENCES groups_tbl(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  note TEXT DEFAULT '',
  date TEXT NOT NULL,
  is_recurring INTEGER DEFAULT 0,
  created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  FOREIGN KEY (group_id) REFERENCES groups_tbl(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  month TEXT NOT NULL DEFAULT 'default',
  UNIQUE(group_id, category, month),
  FOREIGN KEY (group_id) REFERENCES groups_tbl(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti TEXT PRIMARY KEY,
  revoked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

</details>

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
JWT_SECRET=any-long-random-string
CSRF_SECRET=another-long-random-string
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:5432/postgres
PGSSL_INSECURE=1
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
NODE_ENV=development
APP_URL=http://localhost:5173
```

> `PGSSL_INSECURE=1` is needed locally if your OS doesn't trust Supabase's pooler certificate chain. Never set this in production.

### 4. Run

```bash
npm run dev
```

Opens at `http://localhost:5173`. The Express API runs on port 3001 concurrently.

## Deploying to Vercel

Everything (frontend + backend) deploys to a single Vercel project. No separate backend host needed.

### 1. Connect repo to Vercel

Import your GitHub repo at [vercel.com/new](https://vercel.com/new). Vercel will detect Vite automatically.

### 2. Set environment variables

In Vercel → Project Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `JWT_SECRET` | A long random secret |
| `CSRF_SECRET` | A different long random secret |
| `DATABASE_URL` | Supabase Session Pooler URI (port 5432) |
| `ALLOWED_ORIGINS` | Your Vercel URL, e.g. `https://monetrex.vercel.app` |
| `APP_URL` | Same Vercel URL (used in password reset emails) |
| `RESEND_API_KEY` | *(Optional)* From [resend.com](https://resend.com) for password reset emails |
| `RESEND_FROM_EMAIL` | *(Optional)* Sender address, e.g. `noreply@yourdomain.com` |

> Do **not** set `PGSSL_INSECURE` in production. Production uses full TLS verification.

### 3. Deploy

Push to `master` — Vercel deploys automatically. Or trigger manually from the Vercel dashboard.

### How it works on Vercel

```
Vercel project (one domain)
├── /                → React SPA (Vite build, static files)
├── /dashboard, etc. → same SPA (catch-all rewrite)
└── /api/*           → api/index.js (Express app as serverless function)
                              ↕
                       Supabase PostgreSQL (free tier)
```

`vercel.json` routes all `/api/*` requests to the Express serverless function before the SPA catch-all. Frontend and backend share the same domain — no CORS needed.

## Project Structure

```
├── api/
│   └── index.js          # Vercel serverless entry — re-exports Express app
├── server/
│   ├── index.js          # Express app setup (CORS, CSRF, rate limiting, routes)
│   ├── database.js       # pg Pool connecting to Supabase
│   ├── helpers.js        # genId(), safeUser(), createDefaultGroup()
│   ├── middleware/
│   │   └── authenticate.js  # JWT verification middleware
│   └── routes/
│       ├── auth.js        # /api/auth/* (signup, login, logout, password reset)
│       ├── users.js       # /api/me (profile, password change, delete account)
│       ├── data.js        # /api/data (single-request fetch for all frontend state)
│       ├── groups.js      # /api/groups/* (create, rename, leave, invite, remove)
│       ├── transactions.js # /api/groups/:id/transactions, /api/transactions/:id
│       └── budgets.js     # /api/groups/:id/budgets
├── src/
│   ├── context/
│   │   └── AppContext.jsx  # Global state (auth, data, UI slices)
│   ├── pages/             # Dashboard, Transactions, Analytics, Family, Settings, Auth
│   ├── components/        # AddExpenseModal, Sidebar, MobileNav, Charts, etc.
│   └── utils/
│       ├── api.js         # apiFetch(), JWT header injection
│       ├── helpers.js     # formatDate, computeMonthlyData, CATEGORIES
│       └── export.js      # CSV/JSON download
├── vercel.json            # /api/* → serverless, /* → index.html
├── .env.example           # Environment variable template
└── CLAUDE.md              # Claude Code context and architecture notes
```

## Scripts

```bash
npm run dev      # Vite (5173) + Express (3001) concurrently
npm run build    # Production Vite build → /dist
npm run lint     # ESLint
npm run preview  # Preview production build locally
npm run server   # Express only (no Vite)
```
