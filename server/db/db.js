require('dotenv').config();
const { Pool } = require('pg');

// Pool is created lazily-safe: no connection is made at require time.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = { pool, query: (text, params) => pool.query(text, params) };
