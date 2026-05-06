const cron = require('node-cron');
const db = require('./config/database');
const awsService = require('./services/awsService');
const ec2Model = require('./models/ec2Model');
const recommendationService = require('./services/recommendationService');
const { sendIdleInstanceAlert } = require('./emailService');
const { sendSlackAlert } = require('./slackService');
const { listUnattachedEBSVolumes } = require('./services/awsService');
const { generateEBSRecommendations } = require('./services/recommendationService');



async function scanAccount(account) {
  console.log(`[Scheduler] Starting auto-scan for account: ${account.account_name}`);

  try {
    // Step 1: Assume role and get credentials
    const credentials = await awsService.assumeRole(account.aws_account_id, account.region);

    // Step 2: List EC2 instances
    const instances = await awsService.listEC2Instances(credentials, account.region);
    console.log(`[Scheduler] Found ${instances.length} instances for ${account.account_name}`);

    // Step 3: Get CPU metrics and save each instance
    for (const instance of instances) {
      try {
        const cpuMetrics = await awsService.getCPUUtilization(credentials, instance.instanceId, account.region);
        await ec2Model.saveEC2Instance({
          accountId: account.account_id,
          instanceId: instance.instanceId,
          instanceType: instance.instanceType,
          state: instance.state,
          region: account.region,
          availabilityZone: instance.availabilityZone,
          launchTime: instance.launchTime,
          avgCpu: cpuMetrics.averageCPU,
        });
      } catch (err) {
        console.error(`[Scheduler] Failed to process instance ${instance.instanceId}:`, err.message);
      }
    }

    // Step 4: Generate recommendations
    const newRecs = await recommendationService.generateIdleEC2Recommendations(account.account_id);
    console.log('[Scheduler] Recommendations to email:', newRecs.length, JSON.stringify(newRecs[0]));
    await sendIdleInstanceAlert(newRecs, account.account_name);
    await sendSlackAlert(newRecs, account.account_name);

    // Step 4b: EBS volume detection
    const ebsVolumes = await listUnattachedEBSVolumes(credentials, account.region);
    if (ebsVolumes.length > 0) {
      await generateEBSRecommendations(account.account_id, ebsVolumes);
    }

    // Step 5: Update last_synced timestamp
    await db.query(
      'UPDATE aws_accounts SET last_synced = NOW() WHERE account_id = $1',
      [account.account_id]
    );

    console.log(`[Scheduler] ✅ Auto-scan complete for account: ${account.account_name}`);
  } catch (err) {
    console.error(`[Scheduler] ❌ Auto-scan failed for account ${account.account_name}:`, err.message);
  }
}

async function runScheduledScans() {
  console.log('[Scheduler] Running scheduled scan for all accounts...');
  try {
    const result = await db.query('SELECT * FROM aws_accounts WHERE is_active = true');
    const accounts = result.rows;

    if (accounts.length === 0) {
      console.log('[Scheduler] No active accounts found, skipping scan.');
      return;
    }

    for (const account of accounts) {
      await scanAccount(account);
    }
  } catch (err) {
    console.error('[Scheduler] Error fetching accounts:', err.message);
  }
}

function startScheduler() {
  // Runs every 24 hours at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('[Scheduler] Triggering scheduled 24-hour scan...');
    runScheduledScans();
  });

  console.log('[Scheduler] ✅ Scheduler started — scans will run every 24 hours at midnight');
}

module.exports = { startScheduler, runScheduledScans };