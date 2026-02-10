const db = require('../config/database');

class AwsAccount {
  // Create a new AWS account connection
  static async create(userId, accessKeyId, secretAccessKey) {
    const query = `
      INSERT INTO aws_accounts (user_id, access_key_id, secret_access_key, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, user_id, access_key_id, created_at
    `;
    const values = [userId, accessKeyId, secretAccessKey];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Find all accounts for a user
  static async findByUserId(userId) {
    const query = `
      SELECT id, user_id, access_key_id, secret_access_key, created_at
      FROM aws_accounts
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  // Find account by ID
  static async findById(accountId) {
    const query = `
      SELECT id, user_id, access_key_id, secret_access_key, created_at
      FROM aws_accounts
      WHERE id = $1
    `;
    const result = await db.query(query, [accountId]);
    return result.rows[0];
  }

  // Delete an account
  static async delete(accountId) {
    const query = 'DELETE FROM aws_accounts WHERE id = $1 RETURNING id';
    const result = await db.query(query, [accountId]);
    return result.rowCount > 0;
  }

  // Check if user already has an account with this access key
  static async exists(userId, accessKeyId) {
    const query = `
      SELECT id FROM aws_accounts 
      WHERE user_id = $1 AND access_key_id = $2
    `;
    const result = await db.query(query, [userId, accessKeyId]);
    return result.rows.length > 0;
  }
}

module.exports = AwsAccount;