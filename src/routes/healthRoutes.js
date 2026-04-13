const express = require("express");

const { getHealthStatus } = require("../controllers/healthController");

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: API health status
 */
router.get("/", getHealthStatus);

module.exports = router;
