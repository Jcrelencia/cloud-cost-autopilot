const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// Generate recommendations for an account
router.post('/generate/:accountId', recommendationController.generateRecommendations);

// Get all recommendations for an account
router.get('/:accountId', recommendationController.getRecommendations);

// Update recommendation status
router.patch('/:recommendationId', recommendationController.updateRecommendation);

module.exports = router;
