const db = require('../config/db');
const { Payment } = require('../models/paymentModel');
const Order = require('../models/orderModel');
const notificationService = require('./notificationService');

const checkoutService = {
    /**
     * Xử lý toàn bộ luồng sau khi một giao dịch thanh toán trực tuyến thành công.
     * Bao gồm: Cập nhật trạng thái payment, order, payment_id và gửi thông báo.
     * Toàn bộ quá trình được bao bọc trong một transaction.
     *
     * @param {number} orderId - ID của đơn hàng.
     * @param {string} paymentMethod - Phương thức thanh toán (VNPAY, MOMO).
     * @param {string} transactionId - Mã giao dịch từ cổng thanh toán.
     * @returns {Promise<void>}
     * @throws {Error} Nếu có bất kỳ lỗi nào xảy ra trong transaction.
     */
    handleSuccessfulPayment: async (orderId, paymentMethod, transactionId) => {
        const connection = await db.getConnection(); // Lấy một connection cho transaction
        try {
            await connection.beginTransaction(); // Bắt đầu transaction

            // 1. Cập nhật trạng thái Payment thành PAID
            // markAsPaidIfNeeded sẽ trả về 1 nếu thay đổi, 0 nếu đã PAID
            const changed = await Payment.markAsPaidIfNeeded(orderId, transactionId, connection);

            // Chỉ tiếp tục nếu trạng thái payment thực sự thay đổi (tức là chưa PAID trước đó)
            if (changed > 0) {
                // Lấy payment_id của bản ghi payment vừa được cập nhật/xác nhận
                const paymentInfo = await Payment.getByOrderId(orderId, connection);
                if (!paymentInfo || !paymentInfo.payment_id) {
                    throw new Error('Không tìm thấy bản ghi thanh toán để liên kết với đơn hàng.');
                }
                const paymentId = paymentInfo.payment_id;

                // 2. Cập nhật payment_id vào bảng orders
                await Order.updateOrderPaymentId(orderId, paymentId, connection);

                // 3. Cập nhật trạng thái đơn hàng thành PROCESSING
                // Hàm updateOrderStatus có logic kiểm tra trạng thái hiện tại của đơn hàng.
                // Nếu order_type là PRE_ORDER và status là WAITING_FOR_STOCK, thì updateOrderStatus sẽ trừ tồn kho và chuyển thành PENDING_CONFIRMATION trước khi thành PROCESSING.
                // HOẶC có thể đơn giản luôn chuyển thành PROCESSING nếu đó là flow mong muốn.
                await Order.updateOrderStatus(orderId, 'PROCESSING', null, connection);

                // 4. Gửi thông báo cho người dùng
                await notificationService.notifyOrderPaid(orderId, paymentMethod, transactionId, connection);
            }

            await connection.commit(); // Hoàn tất transaction
        } catch (error) {
            await connection.rollback(); // Hoàn tác tất cả nếu có lỗi
            console.error(`[CheckoutService] Lỗi xử lý thanh toán thành công cho đơn hàng ${orderId}:`, error);
            throw error; // Re-throw để controller biết lỗi
        } finally {
            connection.release(); // Trả connection về pool
        }
    }
};

module.exports = checkoutService;