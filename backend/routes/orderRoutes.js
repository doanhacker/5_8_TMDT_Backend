const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// POST tạo đơn hàng mới (cả NORMAL và PRE_ORDER)
router.post('/', orderController.createOrder);

// GET danh sách đơn hàng (Admin xem tất cả, User xem của mình)
router.get('/', orderController.getAllOrders);

// GET chi tiết đơn hàng
router.get('/:id', orderController.getOrderById);

// PUT cập nhật trạng thái đơn hàng (chủ yếu Admin)
router.put('/:id/status', orderController.updateOrderStatus);

// PUT cập nhật địa chỉ giao hàng cho đơn trước trạng thái PROCESSING
router.put('/:id/address', orderController.updateOrderAddress);

// DELETE hủy đơn hàng (khách hàng hoặc Admin)
router.delete('/:id/cancel', orderController.cancelOrder);


module.exports = router;