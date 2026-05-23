const Notification = require('../models/notificationModel');
const notificationService = require('../services/notificationService');
const ALLOWED_TYPES = ['ORDER', 'PROMOTION', 'PRODUCT', 'SYSTEM', 'NEWS'];

const parseBooleanQuery = (value) => {
    if (value === undefined) return undefined;
    if (value === 'true' || value === true || value === '1') return true;
    if (value === 'false' || value === false || value === '0') return false;
    return null;
};

const notificationController = {
    getMyNotifications: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
            const offset = Math.max(parseInt(req.query.offset) || 0, 0);

            const type = req.query.type ? String(req.query.type).toUpperCase().trim() : undefined;
            const isRead = parseBooleanQuery(req.query.is_read);

            if (isRead === null) {
                return res.status(400).json({ success: false, message: 'is_read phải là true/false' });
            }

            if (type && !ALLOWED_TYPES.includes(type)) {
                return res.status(400).json({ success: false, message: 'type không hợp lệ' });
            }

            const filters = { type, isRead };

            const [items, total, unreadCount] = await Promise.all([
                Notification.getUserNotifications(userId, limit, offset, filters),
                Notification.countUserNotifications(userId, filters),
                Notification.countUnread(userId)
            ]);

            return res.status(200).json({
                success: true,
                data: items,
                meta: {
                    total,
                    limit,
                    offset,
                    unread_count: unreadCount
                }
            });
        } catch (error) {
            console.error('[Notification.getMyNotifications]', error);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    readOne: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const notificationId = parseInt(req.params.id);

            if (!notificationId || notificationId <= 0) {
                return res.status(400).json({ success: false, message: 'id không hợp lệ' });
            }

            const affected = await Notification.markAsRead(notificationId, userId);
            if (affected === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
            }

            return res.status(200).json({ success: true, message: 'Đã đánh dấu đọc' });
        } catch (error) {
            console.error('[Notification.readOne]', error);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    readAll: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const affected = await Notification.markAllAsRead(userId);
            return res.status(200).json({
                success: true,
                message: 'Đã đánh dấu đọc tất cả',
                affected
            });
        } catch (error) {
            console.error('[Notification.readAll]', error);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    adminSendNotification: async (req, res) => {
        try {
            const { title, content, type, target, specific_user_id, reference_id, link_url } = req.body;

            if (!title || !type || !target) {
                return res.status(400).json({ success: false, message: 'Thiếu title/type/target' });
            }

            const normalizedType = String(type).toUpperCase().trim();
            if (!ALLOWED_TYPES.includes(normalizedType)) {
                return res.status(400).json({ success: false, message: 'type không hợp lệ' });
            }

            if (target === 'ALL') {
                const result = await notificationService.adminSendToAllActiveUsers({
                    title: title.trim(),
                    content: content || null,
                    type: normalizedType,
                    referenceId: reference_id || null,
                    linkUrl: link_url || null
                });
                

                return res.status(200).json({
                    success: true,
                    message: `Đã gửi thành công đến ${result.insertedCount} người dùng`,

                    realtime_emitted_count: result.emittedCount
                });
            }

            if (target === 'SPECIFIC') {
                const userId = parseInt(specific_user_id);
                if (!userId || userId <= 0) {
                    return res.status(400).json({ success: false, message: 'specific_user_id không hợp lệ' });
                }

                await notificationService.adminSendToSpecificUser({
                    userId,
                    title: title.trim(),
                    content: content || null,
                    type: normalizedType,
                    referenceId: reference_id || null,
                    linkUrl: link_url || null
                });

                return res.status(200).json({ success: true, message: 'Đã gửi thông báo cho user' });
            }

            return res.status(400).json({ success: false, message: 'target không hợp lệ (ALL|SPECIFIC)' });
        } catch (error) {
            console.error('[Notification.adminSend]', error);
            return res.status(500).json({ success: false, message: 'Lỗi server khi gửi thông báo' });
        }
    }
};

module.exports = notificationController;