const express = require("express");

const baseRoutes = require("./baseRoutes");
const healthRoutes = require("./healthRoutes");
const authRoutes = require("../modules/auth/authRoutes");
const productRoutes = require("../modules/products/productRoutes");
const orderRoutes = require("../modules/orders/orderRoutes");
const aiRoutes = require("../modules/ai/aiRoutes");
const recommendationRoutes = require("../modules/recommendation/recommendationRoutes");

const router = express.Router();

router.use("/", baseRoutes);
router.use("/api/health", healthRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/products", productRoutes);
router.use("/api/orders", orderRoutes);
router.use("/api/ai", aiRoutes);
router.use("/api/recommendations", recommendationRoutes);

module.exports = router;
