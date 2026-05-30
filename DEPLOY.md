# Monetrex — Deployment

> Full setup instructions are in [README.md](README.md). This file summarises the production architecture.

## Architecture

```
Vercel (one project, one domain — free tier)
├── /                → React SPA (Vite build, static files)
├── /dashboard, ...  → same SPA (catch-all rewrite in vercel.json)
└── /api/*           → api/index.js  ←  Express app as serverless function
                              ↕
                       Supabase (PostgreSQL, free tier)
                       aws-0-ap-south-1.pooler.supabase.com:5432
```

- No separate backend server required — Express runs inside a Vercel serverless function
- Frontend and backend share one domain — no CORS headers needed in production
- Database is Supabase (PostgreSQL) — connect via Session Pooler (port 5432)

## Vercel Config Files

| File | Purpose |
|---|---|
| `api/index.js` | Re-exports Express app as Vercel serverless handler |
| `vercel.json` | Routes `/api/*` → serverless function, `/*` → `index.html` |
| `.vercelignore` | Excludes `graphify-out/` from build context |

## Required Environment Variables

Set these in Vercel → Project Settings → Environment Variables:

| Variable | Value |
|---|---|
| `JWT_SECRET` | Long random string |
| `CSRF_SECRET` | Different long random string |
| `DATABASE_URL` | Supabase Session Pooler URI (port 5432) |
| `ALLOWED_ORIGINS` | Your Vercel URL, e.g. `https://monetrex.vercel.app` |
| `APP_URL` | Same Vercel URL (for password reset email links) |
| `RESEND_API_KEY` | *(Optional)* Resend API key for password reset emails |
| `RESEND_FROM_EMAIL` | *(Optional)* Sender address |

## Deploy

Push to `master` — Vercel deploys automatically via GitHub integration.
