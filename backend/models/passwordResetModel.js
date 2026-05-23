const db = require('../config/db');

const PasswordReset = {
    // Tạo mã xác thực mới
    async create(userId, email, resetCode, expiresAt) {
        const query = `
            INSERT INTO password_reset_codes (user_id, email, reset_code, expires_at)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [userId, email, resetCode, expiresAt]);
        return result;
    },

    // Lấy mã xác thực chưa sử dụng và chưa hết hạn
    async findValidCode(email, resetCode) {
        const query = `
            SELECT * FROM password_reset_codes
            WHERE email = ? AND reset_code = ? AND is_used = FALSE AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const [rows] = await db.execute(query, [email, resetCode]);
        return rows[0] || null;
    },

    // Đánh dấu mã đã sử dụng
    async markAsUsed(id) {
        const query = `UPDATE password_reset_codes SET is_used = TRUE WHERE id = ?`;
        const [result] = await db.execute(query, [id]);
        return result;
    },

    // Xóa các mã cũ của user (để tránh spam)
    async deleteOldCodes(email) {
        const query = `DELETE FROM password_reset_codes WHERE email = ?`;
        const [result] = await db.execute(query, [email]);
        return result;
    },

    // Xóa các mã đã hết hạn (có thể chạy định kỳ)
    async cleanupExpiredCodes() {
        const query = `DELETE FROM password_reset_codes WHERE expires_at < NOW()`;
        const [result] = await db.execute(query);
        return result;
    }
};

module.exports = PasswordReset;
