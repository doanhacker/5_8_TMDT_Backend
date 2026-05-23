const express           = require('express');
const router            = express.Router();
const paymentController = require('../controllers/paymentController');
const {
    validateRequiredFields,
    validateParamId         // ✅ Thêm
} = require('../middlewares/validateMiddleware');
// ================================================================
// VNPAY CALLBACK
// ================================================================
router.get('/vnpay/return', paymentController.vnpayReturn);  // ← VNPay redirect user về
router.post('/vnpay/ipn',   paymentController.vnpayIPN);     // ← VNPay gọi server-to-server
// MOMO CALLBACKS
router.get('/momo/return', paymentController.momoReturn);
router.post('/momo/ipn', paymentController.momoIPN);
router.post('/process',
    validateRequiredFields(['order_id', 'payment_method']),
    paymentController.processPayment
);

router.get('/:orderId',
    validateParamId('orderId'),     // ✅ Validate route param — KHÔNG dùng validateRequiredFields
    paymentController.getByOrderId
);

router.put('/:orderId/status',
    validateParamId('orderId'),     // ✅ Validate route param
    validateRequiredFields(['status']),
    paymentController.updateStatus
);

module.exports = router;