import pg from 'pg';
const { Pool } = pg;

/* eslint-disable no-undef */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? (process.env.PGSSL_INSECURE === '1' ? { rejectUnauthorized: false } : true)
    : false,
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
