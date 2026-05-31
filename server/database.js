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
