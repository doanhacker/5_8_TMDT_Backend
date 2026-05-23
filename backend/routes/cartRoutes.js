const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// API riêng cho việc hợp nhất giỏ hàng (không dùng _getCartIdentifier middleware)
router.post('/merge', cartController.mergeCarts);

// Middleware để lấy hoặc tạo cart_id trước khi xử lý các request giỏ hàng khác
// Trong một ứng dụng thực tế, middleware này sẽ kiểm tra JWT để lấy user_id hoặc đọc session_id từ cookie.
// Tạm thời lấy từ req.body để đơn giản hóa việc test.
router.use(cartController._getCartIdentifier);

// GET giỏ hàng hiện tại
router.get('/', cartController.getCart);

// POST thêm sản phẩm vào giỏ hàng
router.post('/add', cartController.addItemToCart);

// PUT cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update', cartController.updateCartItemQuantity);

// DELETE xóa một sản phẩm khỏi giỏ hàng
router.delete('/remove/:variantId', cartController.removeItemFromCart);

// DELETE xóa toàn bộ giỏ hàng
router.delete('/clear', cartController.clearCart);



module.exports = router;