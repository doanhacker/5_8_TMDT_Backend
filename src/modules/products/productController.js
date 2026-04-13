const productService = require("./productService");

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get product catalog
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Product catalog scaffold response
 */
const getCatalog = async (req, res, next) => {
  try {
    const result = await productService.getCatalog();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/products/compare:
 *   post:
 *     summary: Compare products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Compare products scaffold response
 */
const compareProducts = async (req, res, next) => {
  try {
    const result = await productService.compareProducts(req.body.productIds);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCatalog,
  compareProducts,
};
