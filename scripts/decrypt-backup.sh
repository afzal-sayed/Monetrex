#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  set -a; source .env; set +a
fi

: "${BACKUP_ENCRYPTION_KEY:?BACKUP_ENCRYPTION_KEY is required}"

# Argument: path to the .enc file, or auto-detect latest in ./backups
if [ -n "${1:-}" ]; then
  ENC_FILE="$1"
else
  ENC_FILE=$(ls -t backups/backup-*.sql.gz.enc 2>/dev/null | head -1)
  if [ -z "$ENC_FILE" ]; then
    echo "Error: no backup file found. Pass the path as an argument:"
    echo "  npm run db:decrypt -- backups/backup-2026-06-17.sql.gz.enc"
    exit 1
  fi
fi

OUT="${ENC_FILE%.gz.enc}.sql"

echo "Decrypting: $ENC_FILE"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -in "$ENC_FILE" \
  -pass env:BACKUP_ENCRYPTION_KEY \
  | gunzip > "$OUT"

echo "Decrypted to: $OUT"
