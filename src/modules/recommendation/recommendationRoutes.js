const express = require("express");

const recommendationController = require("./recommendationController");

const router = express.Router();

router.get("/", recommendationController.getRecommendations);
router.post("/log", recommendationController.logInteraction);

module.exports = router;
