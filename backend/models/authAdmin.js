const pool = require('../config/db');

const AuthAdmin = {
    // Tạo staff account mới
    createStaff: async (userData) => {
        const { email, password_hash, full_name, phone_number } = userData;
        const [result] = await pool.execute(
            `INSERT INTO users (email, password_hash, full_name, phone_number, status) 
             VALUES (?, ?, ?, ?, 'ACTIVE')`,
            [email, password_hash, full_name, phone_number]
        );
        return result.insertId;
    },

    // Gán role cho staff (role_id: staff=2, admin=1)
    assignRole: async (userId, roleId = 2) => {
        await pool.execute(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
        );
    },

    // Lấy staff user theo ID
    getStaffById: async (userId) => {
        const [rows] = await pool.execute(`
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.phone_number,
                r.role_name
            FROM users u
            INNER JOIN user_roles ur ON u.user_id = ur.user_id
            INNER JOIN roles r ON ur.role_id = r.role_id
            WHERE u.user_id = ? AND LOWER(r.role_name) IN ('admin', 'staff')
        `, [userId]);
        return rows[0];
    }
};

module.exports = AuthAdmin;