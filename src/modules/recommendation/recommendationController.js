const recommendationService = require("./recommendationService");

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Get recommendation list
 *     tags:
 *       - Recommendations
 *     responses:
 *       200:
 *         description: Recommendation scaffold response
 */
const getRecommendations = async (req, res, next) => {
  try {
    const result = await recommendationService.getRecommendations(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/recommendations/log:
 *   post:
 *     summary: Log recommendation interaction
 *     tags:
 *       - Recommendations
 *     responses:
 *       200:
 *         description: Recommendation log scaffold response
 */
const logInteraction = async (req, res, next) => {
  try {
    const result = await recommendationService.logInteraction(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  logInteraction,
};
