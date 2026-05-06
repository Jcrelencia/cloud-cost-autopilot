const db = require('../config/database');

/**
 * Save or update an EC2 instance in the database
 * @param {Object} instanceData - EC2 instance data
 * @returns {Object} Saved instance record
 */
async function saveEC2Instance(instanceData) {
  const {
    accountId,
    instanceId,
    instanceType,
    state,
    region,
    availabilityZone,
    launchTime,
    avgCpu = 0,
  } = instanceData;

  const query = `
    INSERT INTO ec2_instances (
      instance_id, 
      account_id, 
      instance_type, 
      state, 
      region, 
      availability_zone,
      launch_time,
      avg_cpu_7d,
      last_scanned
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (instance_id) 
    DO UPDATE SET 
      instance_type = EXCLUDED.instance_type,
      state = EXCLUDED.state,
      region = EXCLUDED.region,
      availability_zone = EXCLUDED.availability_zone,
      avg_cpu_7d = EXCLUDED.avg_cpu_7d,
      last_scanned = NOW(),
      updated_at = NOW()
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      instanceId,
      accountId,
      instanceType,
      state,
      region,
      availabilityZone,
      launchTime,
      avgCpu,
    ]);

    console.log(`✅ Saved instance ${instanceId} to database`);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Error saving instance ${instanceId}:`, error.message);
    throw error;
  }
}

/**
 * Save multiple EC2 instances in bulk
 * @param {Array} instances - Array of instance data objects
 * @returns {Array} Saved instance records
 */
async function saveMultipleInstances(instances) {
  const savedInstances = [];
  
  for (const instance of instances) {
    try {
      const saved = await saveEC2Instance(instance);
      savedInstances.push(saved);
    } catch (error) {
      console.error(`Failed to save instance ${instance.instanceId}:`, error.message);
      // Continue with next instance even if one fails
    }
  }

  console.log(`✅ Saved ${savedInstances.length} out of ${instances.length} instances`);
  return savedInstances;
}

/**
 * Get all EC2 instances for an AWS account
 * @param {string} accountId - AWS account UUID
 * @returns {Array} EC2 instances
 */
async function getEC2InstancesByAccount(accountId) {
  const query = `
    SELECT * FROM ec2_instances
    WHERE account_id = $1
    ORDER BY last_scanned DESC;
  `;

  try {
    const result = await db.query(query, [accountId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching EC2 instances:', error.message);
    throw error;
  }
}

/**
 * Get idle EC2 instances (low CPU usage)
 * @param {string} accountId - AWS account UUID
 * @param {number} cpuThreshold - CPU percentage threshold (default: 5%)
 * @returns {Array} Idle instances
 */
async function getIdleInstances(accountId, cpuThreshold = 5.0) {
  const query = `
    SELECT * FROM ec2_instances
    WHERE account_id = $1
    AND state = 'running'
    AND avg_cpu_7d < $2
    ORDER BY avg_cpu_7d ASC;
  `;

  try {
    const result = await db.query(query, [accountId, cpuThreshold]);
    console.log(`Found ${result.rows.length} idle instances (CPU < ${cpuThreshold}%)`);
    return result.rows;
  } catch (error) {
    console.error('Error fetching idle instances:', error.message);
    throw error;
  }
}

/**
 * Delete EC2 instances for an account (cleanup)
 * @param {string} accountId - AWS account UUID
 */
async function deleteInstancesByAccount(accountId) {
  const query = 'DELETE FROM ec2_instances WHERE account_id = $1;';
  
  try {
    const result = await db.query(query, [accountId]);
    console.log(`Deleted ${result.rowCount} instances for account ${accountId}`);
    return result.rowCount;
  } catch (error) {
    console.error('Error deleting instances:', error.message);
    throw error;
  }
}

module.exports = {
  saveEC2Instance,
  saveMultipleInstances,
  getEC2InstancesByAccount,
  getIdleInstances,
  deleteInstancesByAccount,
};