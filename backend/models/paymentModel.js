const db = require('../config/db');

// ✅ Whitelist tại Model — tầng bảo vệ cuối cùng
const ALLOWED_PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUNDED', 'DEPOSITED'];
const ALLOWED_PAYMENT_METHODS  = ['COD', 'VNPAY', 'MOMO']; 
const PAYABLE_ORDER_STATUSES = ['PENDING_CONFIRMATION', 'WAITING_FOR_STOCK', 'PROCESSING']; // Chỉ những đơn hàng ở trạng thái này mới được thanh toán
const Payment = {

    // ================================================================
    // [CREATE] Tạo payment record
    // ✅ Nhận connection từ ngoài để tham gia transaction của controller
    // ================================================================
    createPayment: async (connection, order_id, payment_method) => {
        if (!ALLOWED_PAYMENT_METHODS.includes(payment_method)) {
            throw new Error('INVALID_PAYMENT_METHOD');
        }

        const [result] = await connection.query(
            `INSERT INTO payments (order_id, payment_method, payment_status)
            VALUES (?, ?, 'UNPAID')`,
            [order_id, payment_method]  // ✅ Parameterized query
        );
        return result.insertId;
    },

    // ================================================================
    // [READ] Kiểm tra payment đã tồn tại chưa
    // ✅ Chỉ SELECT các cột cần thiết, không SELECT *
    // ================================================================
    getByOrderId: async (order_id, connection = db) => {
        const [rows] = await connection.query(
            `SELECT
                payment_id,
                order_id,
                payment_method,
                payment_status,
                transaction_id,
                payment_date
            FROM payments
            WHERE order_id = ?
            LIMIT 1`,
            [order_id]  // ✅ Parameterized query
        );
        return rows[0] || null;
    },

    markAsPaidIfNeeded: async (order_id, transaction_id = null, connection = db) => {
        const [result] = await connection.query(
            `UPDATE payments
             SET payment_status = 'PAID',
                 transaction_id = COALESCE(?, transaction_id)
             WHERE order_id = ?
               AND payment_status <> 'PAID'`,
            [transaction_id, order_id]
        );
        return result.affectedRows; // 1 = vừa chuyển sang PAID, 0 = đã PAID từ trước
    },

    // ================================================================
    // [UPDATE] Cập nhật trạng thái thanh toán
    // ✅ Whitelist tại Model — không để Controller tự do truyền vào
    // ✅ Không nối string query động → tránh SQL Injection
    // ================================================================
    updatePaymentStatus: async (order_id, status, transaction_id = null, connection = db) => {
        // ✅ Double-check whitelist tại Model (Controller cũng đã check)
        if (!ALLOWED_PAYMENT_STATUSES.includes(status)) {
            throw new Error('INVALID_PAYMENT_STATUS');
        }

        // ✅ Dùng CASE thay vì nối string → an toàn, không SQL Injection
        const [result] = await connection.query(
            `UPDATE payments
            SET
                payment_status = ?,
                transaction_id = CASE WHEN ? = 'PAID' THEN ?   ELSE transaction_id END,
                payment_date   = CASE WHEN ? = 'PAID' THEN NOW() ELSE payment_date  END
            WHERE order_id = ?`,
            [status, status, transaction_id, status, order_id]  // ✅ Toàn bộ dùng placeholder
        );
        return result.affectedRows;
    }
};

module.exports = { Payment, ALLOWED_PAYMENT_STATUSES, ALLOWED_PAYMENT_METHODS, PAYABLE_ORDER_STATUSES };