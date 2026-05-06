const recommendationService = require('../services/recommendationService');

/**
 * Generate recommendations for an account
 * POST /api/recommendations/generate/:accountId
 */
async function generateRecommendations(req, res) {
  const { accountId } = req.params;
  const cpuThreshold = parseFloat(req.query.threshold) || 5.0;

  try {
    const recommendations = await recommendationService.generateIdleEC2Recommendations(
      accountId,
      cpuThreshold
    );
    
    const totalSavings = await recommendationService.getTotalPotentialSavings(accountId);

    res.json({
      message: 'Recommendations generated successfully',
      count: recommendations.length,
      totalPotentialSavings: totalSavings,
      recommendations: recommendations,
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
}

/**
 * Get all recommendations for an account
 * GET /api/recommendations/:accountId
 */
async function getRecommendations(req, res) {
  const { accountId } = req.params;
  const { status } = req.query;

  try {
    const recommendations = await recommendationService.getRecommendations(accountId, status);
    const totalSavings = await recommendationService.getTotalPotentialSavings(accountId);

    res.json({
      count: recommendations.length,
      totalPotentialSavings: totalSavings,
      recommendations: recommendations,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      details: error.message
    });
  }
}

/**
 * Update recommendation status
 * PATCH /api/recommendations/:recommendationId
 */
async function updateRecommendation(req, res) {
  const { recommendationId } = req.params;
  const { status } = req.body;

  // Validate status
  const validStatuses = ['pending', 'applied', 'dismissed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be: pending, applied, or dismissed' 
    });
  }

  try {
    const recommendation = await recommendationService.updateRecommendationStatus(
      recommendationId,
      status
    );

    res.json({
      message: 'Recommendation updated successfully',
      recommendation: recommendation,
    });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    
    if (error.message === 'Recommendation not found') {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to update recommendation',
      details: error.message
    });
  }
}

module.exports = {
  generateRecommendations,
  getRecommendations,
  updateRecommendation,
};
