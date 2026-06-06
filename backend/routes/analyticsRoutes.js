const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.use(verifyToken, verifyAdmin);

router.get('/revenue', analyticsController.getRevenue);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/overview', analyticsController.getOverview);
router.get('/cancel-reasons', analyticsController.getCancelReasons);

module.exports = router;
