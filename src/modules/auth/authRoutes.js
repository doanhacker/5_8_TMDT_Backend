const express = require("express");

const authController = require("./authController");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
