const express = require("express");

const aiController = require("./aiController");

const router = express.Router();

router.get("/context", aiController.getAssistantContext);
router.post("/ask", aiController.askAssistant);

module.exports = router;
