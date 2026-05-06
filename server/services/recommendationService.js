const db = require('../config/database');

// EC2 instance pricing per hour (simplified - based on us-east-2 on-demand pricing)
const EC2_PRICING = {
  't2.micro': 0.0116,
  't2.small': 0.023,
  't2.medium': 0.0464,
  't2.large': 0.0928,
  't3.micro': 0.0104,
  't3.small': 0.0208,
  't3.medium': 0.0416,
  't3.large': 0.0832,
  'm5.large': 0.096,
  'm5.xlarge': 0.192,
  'm5.2xlarge': 0.384,
  
};

/**
 * Calculate monthly savings for stopping an instance
 * @param {string} instanceType - EC2 instance type
 * @returns {number} Estimated monthly savings in dollars
 */
function calculateMonthlySavings(instanceType) {
  const hourlyRate = EC2_PRICING[instanceType] || 0.05; // Default rate if not found
  const hoursPerMonth = 730; // Average hours in a month
  return parseFloat((hourlyRate * hoursPerMonth).toFixed(2));
}

/**
 * Generate recommendations for idle EC2 instances
 * @param {string} accountId - AWS account UUID
 * @param {number} cpuThreshold - CPU threshold percentage (default 5%)
 * @returns {Array} Generated recommendations
 */
async function generateIdleEC2Recommendations(accountId, cpuThreshold = 5.0) {
  try {
    console.log(`[Recommendations] Generating idle EC2 recommendations for account ${accountId}`);
    
    // Find all running instances with low CPU
    const query = `
      SELECT * FROM ec2_instances
      WHERE account_id = $1
      AND state = 'running'
      AND avg_cpu_7d < $2
      ORDER BY avg_cpu_7d ASC;
    `;
    
    const result = await db.query(query, [accountId, cpuThreshold]);
    const idleInstances = result.rows;
    
    console.log(`[Recommendations] Found ${idleInstances.length} idle instances`);
    
    const recommendations = [];
    
    for (const instance of idleInstances) {
      const savings = calculateMonthlySavings(instance.instance_type);
      
      // Check if recommendation already exists for this instance
      const existingQuery = `
        SELECT * FROM recommendations
        WHERE account_id = $1 
        AND resource_name = $2 
        AND status = 'pending';
      `;
      const existing = await db.query(existingQuery, [accountId, instance.instance_id]);

      if (existing.rows.length === 0) {
        // Create new recommendation
        const insertQuery = `
          INSERT INTO recommendations (
            account_id, 
            recommendation_type, 
            resource_name, 
            service_name, 
            potential_savings, 
            description, 
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;

        const description = `Instance ${instance.instance_id} (${instance.instance_type}) has averaged ${parseFloat(instance.avg_cpu_7d).toFixed(2)}% CPU utilization over the last 7 days. This instance appears to be idle or underutilized. Consider stopping or terminating this instance to save costs.`;

        const rec = await db.query(insertQuery, [
          accountId,
          'idle_ec2',
          instance.instance_id,
          'EC2',
          savings,
          description,
          'pending',
        ]);

        recommendations.push(rec.rows[0]);
        console.log(`[Recommendations] ✅ Created recommendation for ${instance.instance_id} - Save $${savings}/month`);
     } else {
        console.log(`[Recommendations] ⏭️  Recommendation already exists for ${instance.instance_id}`);
        recommendations.push(existing.rows[0]);
      }
    }

    console.log(`[Recommendations] Generated ${recommendations.length} new recommendations`);
    return recommendations;

  } catch (error) {
    console.error('[Recommendations] Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Get all recommendations for an account
 * @param {string} accountId - AWS account UUID
 * @param {string} status - Filter by status (optional)
 * @returns {Array} Recommendations
 */
async function getRecommendations(accountId, status = null) {
  let query = `
    SELECT * FROM recommendations 
    WHERE account_id = $1
  `;
  const params = [accountId];

  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }

  query += ' ORDER BY potential_savings DESC';

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * Calculate total potential savings
 * @param {string} accountId - AWS account UUID
 * @returns {number} Total potential monthly savings
 */
async function getTotalPotentialSavings(accountId) {
  const query = `
    SELECT SUM(potential_savings) as total_savings
    FROM recommendations
    WHERE account_id = $1 AND status = 'pending';
  `;
  
  const result = await db.query(query, [accountId]);
  return parseFloat(result.rows[0].total_savings || 0);
}

/**
 * Update recommendation status
 * @param {string} recommendationId - Recommendation UUID
 * @param {string} status - New status (pending, applied, dismissed)
 * @returns {Object} Updated recommendation
 */
async function updateRecommendationStatus(recommendationId, status) {
  const query = `
    UPDATE recommendations
    SET status = $1, updated_at = NOW()
    WHERE recommendation_id = $2
    RETURNING *;
  `;
  
  const result = await db.query(query, [status, recommendationId]);
  
  if (result.rows.length === 0) {
    throw new Error('Recommendation not found');
  }
  
  return result.rows[0];
}

async function generateEBSRecommendations(accountId, volumes) {
  try {
    console.log(`[EBS] Generating EBS recommendations for account ${accountId}`);
    const recommendations = [];

    for (const volume of volumes) {
      const existingQuery = `
        SELECT * FROM recommendations
        WHERE account_id = $1 AND resource_name = $2 AND status = 'pending';
      `;
      const existing = await db.query(existingQuery, [accountId, volume.volumeId]);

      if (existing.rows.length === 0) {
        const insertQuery = `
          INSERT INTO recommendations (
            account_id, recommendation_type, resource_name,
            service_name, potential_savings, description, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        const description = `EBS volume ${volume.volumeId} (${volume.sizeGb}GB, ${volume.volumeType}) is not attached to any running instance and is costing $${volume.monthlyCost}/month.`;

        const rec = await db.query(insertQuery, [
          accountId,
          'ebs_unattached',
          volume.volumeId,
          'EBS',
          volume.monthlyCost,
          description,
          'pending',
        ]);
        recommendations.push(rec.rows[0]);
        console.log(`[EBS] ✅ Created recommendation for ${volume.volumeId} - Save $${volume.monthlyCost}/month`);
      } else {
        recommendations.push(existing.rows[0]);
      }
    }

    console.log(`[EBS] Generated ${recommendations.length} EBS recommendations`);
    return recommendations;
  } catch (error) {
    console.error('[EBS] Error generating EBS recommendations:', error);
    throw error;
  }
}
module.exports = {
  generateIdleEC2Recommendations,
  generateEBSRecommendations,
  getRecommendations,
  getTotalPotentialSavings,
  updateRecommendationStatus,
  calculateMonthlySavings,
};
