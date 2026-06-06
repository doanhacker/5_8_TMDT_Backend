const db = require('../config/db');

const logAnalyticsEvent = async ({
    eventType,
    userId = null,
    productId = null,
    sessionId = null,
    metadata = null,
}) => {
    try {
        await db.query(
            `INSERT INTO analytics_events (event_type, user_id, product_id, session_id, metadata)
             VALUES (?, ?, ?, ?, ?)`,
            [
                eventType,
                userId || null,
                productId || null,
                sessionId || null,
                metadata ? JSON.stringify(metadata) : null,
            ]
        );
    } catch (error) {
        console.warn('[AnalyticsEvent] skip log:', error.message);
    }
};

module.exports = {
    logAnalyticsEvent,
};
