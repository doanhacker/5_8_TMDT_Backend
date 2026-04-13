const express = require("express");

const productController = require("./productController");

const router = express.Router();

router.get("/", productController.getCatalog);
router.post("/compare", productController.compareProducts);

module.exports = router;
