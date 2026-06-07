const pool = require('../config/db');

const User = {
    create: async (userData, executor = pool) => {
        const { email, password_hash, full_name, phone_number } = userData;
        const [result] = await executor.execute(
            `INSERT INTO users (email, password_hash, full_name, phone_number, status) 
             VALUES (?, ?, ?, ?, 'ACTIVE')`,
            [email, password_hash, full_name, phone_number !== undefined ? phone_number : null]
        );
        return result.insertId;
    },

    // Tìm user theo email
    findByEmail: async (email, executor = pool) => {
        const [rows] = await executor.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    // Tìm user theo ID
    findById: async (userId, executor = pool) => {
        const [rows] = await executor.execute(
        'SELECT user_id, email, full_name, phone_number, status, token_version, created_at FROM users WHERE user_id = ?',
        [userId]
    );
        return rows[0];
    },

    // Cập nhật mật khẩu user
    updatePassword: async (userId, passwordHash) => {
        const [result] = await pool.execute(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [passwordHash, userId]
        );
        return result.affectedRows;
    },

    // Cập nhật thông tin hồ sơ người dùng
    updateProfile: async (userId, profileData) => {
        const { full_name, phone_number } = profileData;
        const [result] = await pool.execute(
            'UPDATE users SET full_name = ?, phone_number = ? WHERE user_id = ?',
            [full_name, phone_number, userId]
        );
        return result.affectedRows;
    },

    // Gán role cho user (mặc định là customer)
    assignRole: async (userId, roleId = 3, executor = pool) => {
        await executor.execute(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
        );
    },

    // Lấy roles của user
    getUserRoles: async (userId) => {
        const [rows] = await pool.execute(
            `SELECT r.role_id, r.role_name 
             FROM roles r
             INNER JOIN user_roles ur ON r.role_id = ur.role_id
             WHERE ur.user_id = ?`,
            [userId]
        );
        return rows;
    },

    getAllUserAdmin: async () => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                CONCAT(
                    CASE 
                        WHEN LOWER(r.role_name) = 'admin' THEN 'A'
                        WHEN LOWER(r.role_name) = 'staff' THEN 'N'
                        ELSE 'U'
                    END,
                    LPAD(u.user_id, 3, '0')
                ) AS id,
                u.full_name AS name,
                u.email,
                u.phone_number AS phone,
                LOWER(r.role_name) AS role
            FROM users u
            INNER JOIN user_roles ur ON u.user_id = ur.user_id
            INNER JOIN roles r ON ur.role_id = r.role_id
            WHERE LOWER(r.role_name) IN ('admin', 'staff')
            ORDER BY u.user_id DESC
        `);

        return rows;
    } catch (error) {
        console.error("Error getAllUserAdmin:", error);
        throw error;
    }
}
};

module.exports = User;
