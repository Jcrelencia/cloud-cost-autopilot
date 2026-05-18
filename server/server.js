const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');
const { startScheduler } = require('./scheduler');

// Import routes
const awsRoutes = require('./routes/awsRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['https://cloud-cost-autopilot.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
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

// API Routes
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});


// Start server
startScheduler();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Database test: http://localhost:${PORT}/api/db-test`);
});



module.exports = app;