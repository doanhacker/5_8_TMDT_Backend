const express = require("express");

const { getRoot } = require("../controllers/baseController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: General
 *   description: Basic endpoints for backend status
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Check root endpoint
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: Backend is running
 */
router.get("/", getRoot);

module.exports = router;
