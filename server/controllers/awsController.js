const db = require('../config/database');
const awsService = require('../services/awsService');
const ec2Model = require('../models/ec2Model');

/**
 * Connect AWS account (store IAM role ARN)
 * POST /api/aws/connect
 */
async function connectAccount(req, res) {
  const { accountName, roleArn, region = 'us-east-1' } = req.body;
  const userId = req.user?.userId || null;

  // Validate input
  if (!accountName || !roleArn) {
    return res.status(400).json({ error: 'accountName and roleArn are required' });
  }

  try {
    // Test connection first
    console.log('Testing AWS connection...');
    const testResult = await awsService.testConnection(roleArn, region);
    
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Failed to connect to AWS account',
        details: testResult.message
      });
    }

    // Save to database
  const query = `
  INSERT INTO aws_accounts (user_id, account_name, aws_account_id, region, is_active, last_synced)
  VALUES ($1, $2, $3, $4, $5, NOW())
  RETURNING *;
`;

const result = await db.query(query, [userId, accountName, roleArn, region, true]);
    
    res.status(201).json({
      message: 'AWS account connected successfully',
      account: result.rows[0],
      instanceCount: testResult.instanceCount,
    });
  } catch (error) {
    console.error('Error connecting AWS account:', error);
    res.status(500).json({ 
      error: 'Failed to connect AWS account',
      details: error.message
    });
  }
}

/**
 * List connected AWS accounts
 * GET /api/aws/accounts
 */
async function listAccounts(req, res) {
  const userId = req.user?.userId || 'test-user-id';

  try {
    const query = 'SELECT * FROM aws_accounts WHERE user_id = $1 ORDER BY created_at DESC;';
    const result = await db.query(query, [userId]);
    
    res.json({ accounts: result.rows });
  } catch (error) {
    console.error('Error listing accounts:', error);
    res.status(500).json({ error: 'Failed to list accounts' });
  }
}

/**
 * Test AWS connection
 * GET /api/aws/test-connection/:accountId
 */
async function testConnection(req, res) {
  const { accountId } = req.params;

  try {
    const query = 'SELECT * FROM aws_accounts WHERE account_id = $1';
    const result = await db.query(query, [accountId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = result.rows[0];
    const testResult = await awsService.testConnection(account.aws_account_id, account.region);

    if (testResult.success) {
      res.json({
        message: 'Connection successful',
        instanceCount: testResult.instanceCount,
        credentialsExpire: testResult.credentialsExpire,
      });
    } else {
      res.status(400).json({
        message: 'Connection failed',
        error: testResult.message,
      });
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ error: 'Connection test failed', details: error.message });
  }
}

/**
 * Scan EC2 instances and save to database
 * POST /api/aws/scan/:accountId
 */
async function scanEC2(req, res) {
  const { accountId } = req.params;

  try {
    // Get account details
    const accountQuery = 'SELECT * FROM aws_accounts WHERE account_id = $1';
    const accountResult = await db.query(accountQuery, [accountId]);
    
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.rows[0];
    
    console.log(`Starting EC2 scan for account: ${account.account_name}`);
    
    // Step 1: Assume role and get credentials
    const credentials = await awsService.assumeRole(account.aws_account_id, account.region);
    
    // Step 2: List all EC2 instances
    const instances = await awsService.listEC2Instances(credentials, account.region);
    
    console.log(`Found ${instances.length} instances, fetching CPU metrics...`);
    
    // Step 3: For each instance, get CPU metrics and save to database
    const savedInstances = [];
    
    for (const instance of instances) {
      try {
        // Get CPU utilization for this instance
        const cpuMetrics = await awsService.getCPUUtilization(
          credentials,
          instance.instanceId,
          account.region
        );

        // Prepare instance data for database
        const instanceData = {
          accountId: accountId,
          instanceId: instance.instanceId,
          instanceType: instance.instanceType,
          state: instance.state,
          region: account.region,
          availabilityZone: instance.availabilityZone,
          launchTime: instance.launchTime,
          avgCpu: cpuMetrics.averageCPU,
        };

        // Save to database
        const saved = await ec2Model.saveEC2Instance(instanceData);
        savedInstances.push(saved);

      } catch (error) {
        console.error(`Failed to process instance ${instance.instanceId}:`, error.message);
        // Continue with next instance even if one fails
      }
    }

    // Update last_synced timestamp
    await db.query(
      'UPDATE aws_accounts SET last_synced = NOW() WHERE account_id = $1',
      [accountId]
    );

    console.log(`✅ EC2 scan completed: ${savedInstances.length}/${instances.length} instances saved`);

    res.json({
      message: 'EC2 scan completed successfully',
      totalInstances: instances.length,
      savedInstances: savedInstances.length,
      instances: savedInstances,
    });

  } catch (error) {
    console.error('Error scanning EC2:', error);
    res.status(500).json({ 
      error: 'EC2 scan failed', 
      details: error.message 
    });
  }
}

/**
 * Get EC2 instances for an account
 * GET /api/aws/instances/:accountId
 */
async function getInstances(req, res) {
  const { accountId } = req.params;

  try {
    const instances = await ec2Model.getEC2InstancesByAccount(accountId);
    
    res.json({
      count: instances.length,
      instances: instances,
    });
  } catch (error) {
    console.error('Error getting instances:', error);
    res.status(500).json({ error: 'Failed to get instances' });
  }
}

/**
 * Get idle EC2 instances
 * GET /api/aws/instances/:accountId/idle
 */
async function getIdleInstances(req, res) {
  const { accountId } = req.params;
  const cpuThreshold = parseFloat(req.query.threshold) || 5.0;

  try {
    const idleInstances = await ec2Model.getIdleInstances(accountId, cpuThreshold);
    
    res.json({
      count: idleInstances.length,
      threshold: cpuThreshold,
      instances: idleInstances,
    });
  } catch (error) {
    console.error('Error getting idle instances:', error);
    res.status(500).json({ error: 'Failed to get idle instances' });
  }
}

/**
 * Get account details including last_synced
 * GET /api/aws/account/:accountId
 */
async function getAccount(req, res) {
  const { accountId } = req.params;
  try {
    const result = await db.query('SELECT * FROM aws_accounts WHERE account_id = $1', [accountId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting account:', error);
    res.status(500).json({ error: 'Failed to get account' });
  }
}

module.exports = {
  connectAccount,
  listAccounts,
  testConnection,
  scanEC2,
  getInstances,
  getIdleInstances,
  getAccount,
};