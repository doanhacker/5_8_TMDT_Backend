const db = require('../config/db');

const normalizeSessionId = (value) => {
    const sessionId = String(value || '').trim();
    return sessionId || null;
};

const AiChatLog = {
    async getHistory({ userId = null, sessionId = null, limit = 30 }) {
        const normalizedSessionId = normalizeSessionId(sessionId);
        const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));

        let query = `
            SELECT log_id, session_id, user_id, sender_type, content, created_at
            FROM ai_chat_logs
        `;
        const params = [];

        if (userId) {
            query += ' WHERE user_id = ?';
            params.push(userId);
        } else if (normalizedSessionId) {
            query += ' WHERE session_id = ? AND user_id IS NULL';
            params.push(normalizedSessionId);
        } else {
            return [];
        }

        query += ' ORDER BY created_at ASC, log_id ASC LIMIT ?';
        params.push(safeLimit);

        const [rows] = await db.query(query, params);
        return rows;
    },

    async create({ sessionId = null, userId = null, senderType, content }) {
        const normalizedSessionId = normalizeSessionId(sessionId);
        const message = String(content || '').trim();
        const sender = String(senderType || '').toUpperCase();

        if (!message || !['USER', 'BOT'].includes(sender)) {
            return null;
        }

        const [result] = await db.query(
            `INSERT INTO ai_chat_logs (session_id, user_id, sender_type, content)
             VALUES (?, ?, ?, ?)`,
            [normalizedSessionId || `user-${userId || 'guest'}`, userId || null, sender, message]
        );

        return result.insertId;
    },
};

module.exports = AiChatLog;
