const express = require('express');
const router = express.Router();
const awsController = require('../controllers/awsController');

// Connect AWS account
router.post('/connect', awsController.connectAccount);

// List connected accounts
router.get('/accounts', awsController.listAccounts);

// Test AWS connection
router.get('/test-connection/:accountId', awsController.testConnection);

// Scan EC2 instances
router.post('/scan/:accountId', awsController.scanEC2);

// Get EC2 instances for an account
router.get('/instances/:accountId', awsController.getInstances);

// Get idle EC2 instances
router.get('/instances/:accountId/idle', awsController.getIdleInstances);

router.get('/account/:accountId', awsController.getAccount);

module.exports = router;