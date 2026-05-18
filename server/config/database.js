const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cloud_cost_autopilot',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.stack);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};