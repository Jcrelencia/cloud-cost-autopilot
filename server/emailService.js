const nodemailer = require('nodemailer');

async function sendIdleInstanceAlert(recommendations, accountName) {
  if (!recommendations || recommendations.length === 0) {
    console.log('[Email] No new recommendations, skipping alert.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const totalSavings = recommendations
    .reduce((sum, rec) => sum + parseFloat(rec.potential_savings || 0), 0)
    .toFixed(2);

  const instanceList = recommendations
    .map(rec => `- ${rec.resource_name} — $${parseFloat(rec.potential_savings).toFixed(2)}/month`)
    .join('\n');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `Cloud Cost Autopilot: ${recommendations.length} idle instance(s) detected in ${accountName}`,
    text: `
Cloud Cost Autopilot — Idle Instance Alert

Account: ${accountName}
New idle instances detected: ${recommendations.length}
Total potential savings: $${totalSavings}/month

Idle Instances:
${instanceList}

Log in to your dashboard to review and take action.
---
This alert was sent automatically by Cloud Cost Autopilot.
    `.trim(),
  };

  try {
    const startTime = Date.now();
    console.log('[Email] Attempting to send to:', process.env.EMAIL_USER);
    await transporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;
    console.log(`[Email] ✅ Alert sent in ${duration}ms`);
  } catch (error) {
    console.error('[Email] ❌ Failed to send alert:', error.message);
  }
}

module.exports = { sendIdleInstanceAlert };