const db = require('../config/db');

const ALLOWED_NOTIFICATION_TYPES = ['ORDER', 'PROMOTION', 'PRODUCT', 'SYSTEM', 'NEWS'];

const buildFilterQuery = (userId, { isRead, type }) => {
    const where = ['user_id = ?'];
    const params = [userId];

    if (typeof isRead === 'boolean') {
        where.push('is_read = ?');
        params.push(isRead);
    }

    if (type) {
        if (!ALLOWED_NOTIFICATION_TYPES.includes(type)) {
            throw new Error('INVALID_NOTIFICATION_TYPE');
        }
        where.push('type = ?');
        params.push(type);
    }

    return { whereSql: where.join(' AND '), params };
};

const Notification = {
    getUserNotifications: async (userId, limit = 20, offset = 0, filters = {}) => {
        const { whereSql, params } = buildFilterQuery(userId, filters);

        const [rows] = await db.query(
            `SELECT notification_id, title, content, type, reference_id, link_url, is_read, created_at
             FROM notifications
             WHERE ${whereSql}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        return rows;
    },
    getActiveUserIds: async () => {
        const [rows] = await db.query(
            `SELECT user_id
             FROM users
             WHERE status = 'ACTIVE'`
        );
        return rows.map(r => r.user_id);
    },

    countUserNotifications: async (userId, filters = {}) => {
        const { whereSql, params } = buildFilterQuery(userId, filters);

        const [rows] = await db.query(
            `SELECT COUNT(*) AS total
             FROM notifications
             WHERE ${whereSql}`,
            params
        );
        return rows[0]?.total || 0;
    },

    countUnread: async (userId) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) AS unread_count
             FROM notifications
             WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );
        return rows[0]?.unread_count || 0;
    },

    markAsRead: async (notificationId, userId) => {
        const [result] = await db.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE notification_id = ? AND user_id = ?`,
            [notificationId, userId]
        );
        return result.affectedRows;
    },

    markAllAsRead: async (userId) => {
        const [result] = await db.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );
        return result.affectedRows;
    },

    create: async (userId, title, content, type, referenceId = null, linkUrl = null, connection = db) => {
        const [result] = await connection.query(
            `INSERT INTO notifications (user_id, title, content, type, reference_id, link_url, is_read)
             VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
            [userId, title, content, type, referenceId, linkUrl]
        );
        return result.insertId;
    },

    // Tối ưu cho broadcast lớn: insert-select trực tiếp trong DB
    createBulkForActiveUsers: async (title, content, type, referenceId = null, linkUrl = null, connection = db) => {
        const [result] = await connection.query(
            `INSERT INTO notifications (user_id, title, content, type, reference_id, link_url, is_read)
             SELECT user_id, ?, ?, ?, ?, ?, FALSE
             FROM users
             WHERE status = 'ACTIVE'`,
            [title, content, type, referenceId, linkUrl]
        );
        return result.affectedRows;
    }
};

module.exports = Notification;