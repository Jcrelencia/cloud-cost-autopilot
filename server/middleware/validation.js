// Validation middleware for AWS connection
exports.validateAwsConnection = (req, res, next) => {
  const { accessKeyId, secretAccessKey, userId } = req.body;

  // Check for missing fields
  if (!accessKeyId || !secretAccessKey || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields',
      required: ['accessKeyId', 'secretAccessKey', 'userId']
    });
  }

  // Basic format validation for AWS Access Key ID
  if (!/^AKIA[0-9A-Z]{16}$/.test(accessKeyId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid AWS Access Key ID format. Should start with AKIA followed by 16 characters.'
    });
  }

  // Basic validation for Secret Access Key (should be 40 characters)
  if (secretAccessKey.length !== 40) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid AWS Secret Access Key format. Should be 40 characters long.'
    });
  }

  // Validate userId is a number
  // Validate userId is a valid UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  return res.status(400).json({
    status: 'error',
    message: 'Invalid userId. Must be a valid UUID.'
  });
}

  next();
};