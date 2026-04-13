const aiService = require("./aiService");

/**
 * @swagger
 * /api/ai/context:
 *   get:
 *     summary: Get AI assistant context
 *     tags:
 *       - AI Assistant
 *     responses:
 *       200:
 *         description: AI context scaffold response
 */
const getAssistantContext = async (req, res, next) => {
  try {
    const result = await aiService.getAssistantContext();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/ai/ask:
 *   post:
 *     summary: Ask AI assistant
 *     tags:
 *       - AI Assistant
 *     responses:
 *       200:
 *         description: AI ask scaffold response
 */
const askAssistant = async (req, res, next) => {
  try {
    const result = await aiService.askAssistant(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssistantContext,
  askAssistant,
};
