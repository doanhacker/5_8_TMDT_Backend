const db = require('../config/db');

const UserAddress = {
    /**
     * Lấy thông tin địa chỉ theo ID.
     * @param {number} addressId - ID của địa chỉ.
     * @returns {Promise<Object|null>} Đối tượng địa chỉ hoặc null nếu không tìm thấy.
     */
    getById: async (addressId) => {
        const [rows] = await db.query(
            'SELECT address_id, user_id, receiver_name, receiver_phone, specific_address, ward, district, province, is_default FROM user_addresses WHERE address_id = ? LIMIT 1',
            [addressId]
        );
        return rows[0] || null;
    },

    /**
     * Lấy danh sách địa chỉ theo ID người dùng.
     * @param {number} userId - ID của người dùng.
     * @returns {Promise<Array>} Mảng các đối tượng địa chỉ.
     */
    getByUserId: async (userId) => {
        const [rows] = await db.query(
            'SELECT address_id, user_id, receiver_name, receiver_phone, specific_address, ward, district, province, is_default FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, address_id DESC',
            [userId]
        );
        return rows;
    },

    clearDefaultByUserId: async (userId) => {
        const [result] = await db.query(
            'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows;
    },

    /**
     * Thêm địa chỉ mới cho người dùng.
     * @param {Object} addressData - Dữ liệu địa chỉ (user_id, receiver_name, receiver_phone, specific_address, ward, district, province, is_default).
     * @returns {Promise<number>} ID của địa chỉ vừa được thêm.
     */
    create: async (addressData) => {
        const { user_id, receiver_name, receiver_phone, specific_address, ward, district, province, is_default } = addressData;
        const [result] = await db.query(
            `INSERT INTO user_addresses (user_id, receiver_name, receiver_phone, specific_address, ward, district, province, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, receiver_name, receiver_phone, specific_address, ward, district, province, is_default ?? false]
        );
        return result.insertId;
    },

    /**
     * Cập nhật địa chỉ.
     * @param {number} addressId - ID của địa chỉ cần cập nhật.
     * @param {Object} updateData - Dữ liệu cần cập nhật.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    update: async (addressId, updateData) => {
        const allowedFields = ['receiver_name', 'receiver_phone', 'specific_address', 'ward', 'district', 'province', 'is_default'];
        const setClauses = [];
        const values = [];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });

        if (setClauses.length === 0) return 0; // Không có trường nào để cập nhật

        values.push(addressId);
        const [result] = await db.query(
            `UPDATE user_addresses SET ${setClauses.join(', ')} WHERE address_id = ?`,
            values
        );
        return result.affectedRows;
    },

    /**
     * Xóa địa chỉ.
     * @param {number} addressId - ID của địa chỉ cần xóa.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    delete: async (addressId) => {
        const [result] = await db.query('DELETE FROM user_addresses WHERE address_id = ?', [addressId]);
        return result.affectedRows;
    }
};

module.exports = UserAddress;