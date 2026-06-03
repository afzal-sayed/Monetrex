import pg from 'pg';
const { Pool } = pg;

/* eslint-disable no-undef */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (() => {
    if (!process.env.DATABASE_URL) return false;
    if (process.env.PGSSL_INSECURE === '1') return { rejectUnauthorized: false };
    if (process.env.PGSSL_CA) return { ca: process.env.PGSSL_CA, rejectUnauthorized: true };
    return { rejectUnauthorized: true };
  })(),
  max: 2,
});
/* eslint-enable no-undef */

export async function query(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function run(sql, params = []) {
  await pool.query(sql, params);
}

async function runSchema() {
  await pool.query(`
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
      created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Member',
      spend_limit REAL,
      created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
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
      created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      month TEXT NOT NULL DEFAULT 'default',
      UNIQUE(group_id, category, month)
    );
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      jti TEXT PRIMARY KEY,
      revoked_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS custom_categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      emoji TEXT,
      type TEXT DEFAULT 'expense',
      created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      UNIQUE(user_id, name)
    );
  `);
}

/* eslint-disable no-undef */
if (process.env.DATABASE_URL) await runSchema();
/* eslint-enable no-undef */
