const express = require("express");

const orderController = require("./orderController");

const router = express.Router();

router.get("/", orderController.getMyOrders);
router.post("/", orderController.createOrder);

module.exports = router;
