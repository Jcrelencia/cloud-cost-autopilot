const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');
const { startScheduler } = require('./scheduler');

const awsRoutes = require('./routes/awsRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['https://cloud-cost-autopilot.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.use('/api/aws', awsRoutes);
app.use('/api/recommendations', recommendationRoutes);

app.get('/api/debug/instances', async (req, res) => {
  const result = await db.query('SELECT instance_id, state, avg_cpu_7d, account_id FROM ec2_instances;');
  res.json(result.rows);
});

app.get('/api/debug/clear', async (req, res) => {
  await db.query('DELETE FROM recommendations;');
  await db.query('DELETE FROM ec2_instances;');
  await db.query('DELETE FROM aws_accounts;');
  res.json({ message: 'Cleared all data' });
});

app.get('/api/debug/run-scan', async (req, res) => {
  const { runScheduledScans } = require('./scheduler');
  await runScheduledScans();
  res.json({ message: 'Scheduled scan triggered manually' });
});

app.get('/api/debug/test-email', async (req, res) => {
  const { sendIdleInstanceAlert } = require('./emailService');
  const testRecs = [
    { resource_name: 'i-0aaaa1ba6fbbe5e74', potential_savings: 8.47 },
    { resource_name: 'i-0399ec22a28cb0ecc', potential_savings: 8.47 }
  ];
  await sendIdleInstanceAlert(testRecs, 'Jcrelencia');
  res.json({ message: 'Test email triggered' });
});

app.get('/api/setup-db', async (req, res) => {
  try {
    await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS aws_accounts (
        account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        account_name VARCHAR(255) NOT NULL,
        aws_account_id VARCHAR(255) NOT NULL,
        region VARCHAR(50) DEFAULT 'us-east-1',
        is_active BOOLEAN DEFAULT true,
        last_synced TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`DROP TABLE IF EXISTS ec2_instances;`);
    await db.query(`
      CREATE TABLE ec2_instances (
        instance_id VARCHAR(50),
        account_id UUID,
        instance_type VARCHAR(50),
        state VARCHAR(20),
        region VARCHAR(50),
        availability_zone VARCHAR(50),
        launch_time TIMESTAMP,
        avg_cpu_7d DECIMAL(5,2) DEFAULT 0,
        max_cpu_7d DECIMAL(5,2) DEFAULT 0,
        last_scanned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (instance_id, account_id)
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        account_id UUID,
        recommendation_type VARCHAR(50) NOT NULL,
        resource_name VARCHAR(255),
        service_name VARCHAR(100),
        potential_savings DECIMAL(10,2),
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    res.json({ message: 'Database setup complete' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

startScheduler();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Database test: http://localhost:${PORT}/api/db-test`);
});

module.exports = app;