const db = require('../config/db');
const Notification = require('../models/notificationModel');
const { emitToUser, emitToUsers } = require('../socket/realtime');
const { buildNotificationTemplate } = require('../helpers/notificationTemplateHelper');

const sendToUser = async ({ userId, type, title, content, referenceId = null, linkUrl = null }, connection = db) => {
    const notificationId = await Notification.create(
        userId,
        title,
        content,
        type,
        referenceId,
        linkUrl,
        connection
    );

    const payload = {
        notification_id: notificationId,
        user_id: userId,
        title,
        content,
        type,
        reference_id: referenceId,
        link_url: linkUrl,
        is_read: false,
        created_at: new Date().toISOString()
    };

    emitToUser(userId, 'notification:new', payload);
    return payload;
};

const notifyByTemplate = async (userId, templateKey, payload = {}, connection = db) => {
    const tpl = buildNotificationTemplate(templateKey, payload);
    return sendToUser({
        userId,
        type: tpl.type,
        title: tpl.title,
        content: tpl.content,
        referenceId: tpl.referenceId,
        linkUrl: tpl.linkUrl
    }, connection);
};

const notifyOrderPaid = async (orderId, paymentMethod, transactionId = null, connection = db) => {
    const [rows] = await (connection || db).query(
        `SELECT order_id, user_id
         FROM orders
         WHERE order_id = ?
         LIMIT 1`,
        [orderId]
    );
    if (!rows[0]) {
        console.warn(`[NotificationService] Không tìm thấy đơn hàng ID ${orderId} để gửi thông báo thanh toán.`);
        return null;
    }

    return notifyByTemplate(rows[0].user_id, 'ORDER_PAID', {
        orderId,
        paymentMethod,
        transactionId
    }, connection);
};

/**
 * Gửi thông báo đến người dùng khi trạng thái đơn hàng của họ thay đổi.
 * ✅ THAY ĐỔI: THÊM HÀM MỚI
 * @param {number} orderId - ID của đơn hàng.
 * @param {number} userId - ID của người dùng sở hữu đơn hàng.
 * @param {string} oldStatus - Trạng thái cũ của đơn hàng.
 * @param {string} newStatus - Trạng thái mới của đơn hàng.
 * @param {Object} connection - Đối tượng connection nếu đang trong transaction.
 * @returns {Promise<Object|null>}
 */
const notifyOrderStatusChange = async (orderId, userId, oldStatus, newStatus, connection = db) => { // THAY ĐỔI
    return notifyByTemplate(userId, 'ORDER_STATUS_CHANGED', {
        orderId,
        oldStatus,
        newStatus
    }, connection);
};

const adminSendToSpecificUser = async ({ userId, title, content, type, referenceId = null, linkUrl = null }, connection=db) => {
    return sendToUser({
        userId,
        type,
        title,
        content,
        referenceId,
        linkUrl
    }, connection);
};

const adminSendToAllActiveUsers = async ({ title, content, type, referenceId = null, linkUrl = null }, connection =db) => {
    const insertedCount = await Notification.createBulkForActiveUsers(
        title,
        content,
        type,
        referenceId,
        linkUrl,
        connection
    );

    const activeUserIds = await Notification.getActiveUserIds();
    emitToUsers(activeUserIds, 'notification:refresh', {
        reason: "ADMIN_BROADCAST",
        at: new Date().toISOString()
    });
    return {
        insertedCount,
        emittedCount: activeUserIds.length
    };
};

module.exports = {
    sendToUser,
    notifyByTemplate,
    notifyOrderPaid,
    notifyOrderStatusChange,
    adminSendToSpecificUser,
    adminSendToAllActiveUsers
};