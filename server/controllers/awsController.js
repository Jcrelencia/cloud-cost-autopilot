const db = require('../config/database');

// Connect AWS account
exports.connectAccount = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, userId } = req.body;

    // TODO: In production, you should:
    // 1. Validate the AWS credentials with AWS SDK
    // 2. Encrypt the credentials before storing
    // 3. Use AWS Secrets Manager for better security

    const query = `
      INSERT INTO aws_accounts (user_id, account_name, aws_account_id, access_key_encrypted, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING account_id, user_id, created_at
    `;
    
    // For now, we'll store both keys together in access_key_encrypted
    // In production, these should be properly encrypted
    const combinedKeys = JSON.stringify({ accessKeyId, secretAccessKey });
    const values = [userId, 'Default Account', '000000000000', combinedKeys];
    const result = await db.query(query, values);

    res.status(201).json({
      status: 'success',
      message: 'AWS account connected successfully',
      data: {
        id: result.rows[0].account_id,
        userId: result.rows[0].user_id,
        connectedAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error connecting AWS account:', error);
    
    // Handle duplicate entry error
    if (error.code === '23505') {
      return res.status(409).json({
        status: 'error',
        message: 'AWS account already connected for this user'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to connect AWS account',
      error: error.message
    });
  }
};

// Get all AWS accounts for a user
exports.getAccounts = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT account_id, user_id, account_name, created_at
      FROM aws_accounts
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [userId]);

    res.json({
      status: 'success',
      data: result.rows.map(row => ({
        id: row.account_id,
        userId: row.user_id,
        accountName: row.account_name,
        connectedAt: row.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching AWS accounts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch AWS accounts',
      error: error.message
    });
  }
};

// Disconnect AWS account
exports.disconnectAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    const query = 'DELETE FROM aws_accounts WHERE account_id = $1 RETURNING account_id';
    const result = await db.query(query, [accountId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'AWS account not found'
      });
    }

    res.json({
      status: 'success',
      message: 'AWS account disconnected successfully'
    });

  } catch (error) {
    console.error('Error disconnecting AWS account:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to disconnect AWS account',
      error: error.message
    });
  }
};