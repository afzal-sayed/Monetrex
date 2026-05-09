import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, 'data');
export const DB_PATH = join(DATA_DIR, 'monetrex.db');

try { mkdirSync(DATA_DIR, { recursive: true }); } catch { /* dir already exists */ }

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar      TEXT,
    notifications INTEGER DEFAULT 1,
    weekly_report INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS groups_tbl (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    owner_id   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id          TEXT PRIMARY KEY,
    group_id    TEXT NOT NULL,
    user_id     TEXT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'Member',
    spend_limit REAL,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups_tbl(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id           TEXT PRIMARY KEY,
    group_id     TEXT NOT NULL,
    member_id    TEXT NOT NULL,
    title        TEXT NOT NULL,
    amount       REAL NOT NULL,
    category     TEXT NOT NULL DEFAULT 'General',
    note         TEXT DEFAULT '',
    date         TEXT NOT NULL,
    is_recurring INTEGER DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id)  REFERENCES groups_tbl(id)  ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id       TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    category TEXT NOT NULL,
    amount   REAL NOT NULL,
    month    TEXT NOT NULL DEFAULT 'default',
    UNIQUE(group_id, month, category),
    FOREIGN KEY (group_id) REFERENCES groups_tbl(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti        TEXT PRIMARY KEY,
    revoked_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migrate existing budgets table — add month column if missing (idempotent)
try {
  db.exec(`ALTER TABLE budgets ADD COLUMN month TEXT NOT NULL DEFAULT 'default'`);
} catch { /* column already exists */ }

export default db;
