const orderService = require("./orderService");

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get customer orders
 *     tags:
 *       - Orders
 *     responses:
 *       200:
 *         description: Orders scaffold response
 */
const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const result = await orderService.getMyOrders(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags:
 *       - Orders
 *     responses:
 *       200:
 *         description: Create order scaffold response
 */
const createOrder = async (req, res, next) => {
  try {
    const result = await orderService.createOrder(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  createOrder,
};
