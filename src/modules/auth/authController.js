const authService = require("./authService");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Auth module scaffold response
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Auth module scaffold response
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
};
