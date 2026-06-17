#!/usr/bin/env bash
set -euo pipefail

# Source .env if present (local dev convenience — never runs in CI)
if [ -f .env ]; then
  set -a; source .env; set +a
fi

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_ENCRYPTION_KEY:?BACKUP_ENCRYPTION_KEY is required}"

OUTPUT_DIR="${BACKUP_OUTPUT_DIR:-./backups}"
DATE=$(date +%Y-%m-%d)
OUT="${OUTPUT_DIR}/backup-${DATE}.sql.gz.enc"

mkdir -p "$OUTPUT_DIR"

# Find a pg_dump binary >= version 17 (matches Supabase PostgreSQL 17)
PG_DUMP=""
for candidate in /usr/lib/postgresql/17/bin/pg_dump /usr/lib/postgresql/16/bin/pg_dump pg_dump; do
  if command -v "$candidate" &>/dev/null || [ -x "$candidate" ]; then
    ver=$("$candidate" --version 2>/dev/null | grep -oP '\d+' | head -1)
    if [ "${ver:-0}" -ge 17 ]; then
      PG_DUMP="$candidate"
      break
    fi
  fi
done

if [ -z "$PG_DUMP" ]; then
  echo "Error: pg_dump >= 17 not found. Install it with:"
  echo "  sudo apt-get install -y postgresql-client-17"
  echo "  (requires the PGDG apt repo — see docs/superpowers/specs/2026-06-17-db-backup-design.md)"
  exit 1
fi

echo "Dumping database..."
$PG_DUMP "$DATABASE_URL" \
  | gzip \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 100000 \
      -pass env:BACKUP_ENCRYPTION_KEY \
      -out "$OUT"

echo "Backup written to: $OUT"
