# DB Backup Design

**Date:** 2026-06-17  
**Status:** Implemented

## Problem

Supabase free tier does not include automated backups. The database needs a free, automated backup strategy.

## Solution

Daily `pg_dump` via GitHub Actions, encrypted with AES-256-CBC, stored on an orphan `db-backups` branch in the same repo. 14-day rolling retention handled by the workflow.

## Components

- `scripts/backup-db.sh` — local backup script (pg_dump → gzip → openssl)
- `.github/workflows/db-backup.yml` — daily cron at midnight UTC
- `db-backups` branch — orphan branch, never merged to master, encrypted dumps only

## Secrets Required

| Secret | Where set |
|--------|-----------|
| `DATABASE_URL` | GitHub repo → Settings → Secrets → Actions |
| `BACKUP_ENCRYPTION_KEY` | GitHub repo → Settings → Secrets → Actions |

**Warning:** The `BACKUP_ENCRYPTION_KEY` must be stored securely (password manager). Loss of this key makes all encrypted backups unrestorable.

## Restore Process

```bash
# 1. Fetch the encrypted file from db-backups branch
git fetch origin db-backups
git checkout origin/db-backups -- backup-YYYY-MM-DD.sql.gz.enc

# 2. Decrypt
export BACKUP_ENCRYPTION_KEY="your-key-here"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -in backup-YYYY-MM-DD.sql.gz.enc \
  -pass env:BACKUP_ENCRYPTION_KEY \
  | gunzip > restore.sql

# 3. Restore (WARNING: this overwrites the target database)
psql "$DATABASE_URL" < restore.sql
```

## Constraints

- `pg_dump` is read-only — never modifies Supabase data.
- `db-backups` branch must never be merged to master.
- Backup files are never committed to master in any form.
