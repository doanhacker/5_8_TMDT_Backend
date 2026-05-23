const pool = require('../config/db');

const AdminCustomerModel = {
    getAllCustomersWithStats: async () => {
        const [rows] = await pool.execute(
            `SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.phone_number,
                u.status,
                u.created_at,
                COUNT(o.order_id) AS total_orders,
                COALESCE(SUM(CASE WHEN o.status != 'CANCELLED' THEN o.total_amount ELSE 0 END), 0) AS total_spent
            FROM users u
            INNER JOIN user_roles ur ON u.user_id = ur.user_id
            INNER JOIN roles r ON ur.role_id = r.role_id
            LEFT JOIN orders o ON u.user_id = o.user_id
            WHERE LOWER(r.role_name) = 'customer'
            GROUP BY u.user_id
            ORDER BY u.user_id DESC`
        );
        return rows;
    },

    updateCustomerStatus: async (userId, status) => {
        const [result] = await pool.execute(
            'UPDATE users SET status = ? WHERE user_id = ?',
            [status, userId]
        );
        return result.affectedRows;
    }
};

module.exports = AdminCustomerModel;
