const https = require('https');
const url = require('url');

async function sendSlackAlert(recommendations, accountName) {
  if (!recommendations || recommendations.length === 0) {
    console.log('[Slack] No new recommendations, skipping alert.');
    return;
  }

  const totalSavings = recommendations
    .reduce((sum, rec) => sum + parseFloat(rec.potential_savings || 0), 0)
    .toFixed(2);

  const instanceList = recommendations
    .map(rec => '- ' + rec.resource_name + ' $' + parseFloat(rec.potential_savings).toFixed(2) + '/month')
    .join('\n');

  const message = {
    text: 'Cloud Cost Autopilot Alert: ' + recommendations.length + ' idle instance(s) detected in ' + accountName + '. Total savings: $' + totalSavings + '/month.\n' + instanceList
  };

  return new Promise((resolve, reject) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) { console.warn('[Slack] No webhook URL configured'); return; }
    const parsedUrl = new URL(webhookUrl);
    const body = JSON.stringify(message); 

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, function(res) {
      console.log('[Slack] Alert sent with status: ' + res.statusCode);
      resolve();
    });

    req.on('error', function(error) {
      console.error('[Slack] Failed to send alert:', error.message);
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

module.exports = { sendSlackAlert };