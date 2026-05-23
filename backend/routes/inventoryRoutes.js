const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// POST tạo phiếu nhập mới
router.post('/receipts', inventoryController.createImportReceipt);

// GET tất cả các phiếu nhập (có phân trang, lọc)
router.get('/receipts', inventoryController.getAllImportReceipts);

// GET chi tiết một phiếu nhập theo ID
router.get('/receipts/:id', inventoryController.getImportReceiptById);

// GET danh sách sản phẩm tồn kho thấp
router.get('/low-stock', inventoryController.getLowStockProducts);

module.exports = router;