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

echo "Dumping database..."
pg_dump "$DATABASE_URL" \
  | gzip \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 100000 \
      -pass env:BACKUP_ENCRYPTION_KEY \
      -out "$OUT"

echo "Backup written to: $OUT"
