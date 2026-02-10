const express = require('express');
const router = express.Router();
const awsController = require('../controllers/awsController');
const { validateAwsConnection } = require('../middleware/validation');

// AWS account connection routes
router.post('/connect', validateAwsConnection, awsController.connectAccount);
router.get('/accounts/:userId', awsController.getAccounts);
router.delete('/disconnect/:accountId', awsController.disconnectAccount);

module.exports = router;