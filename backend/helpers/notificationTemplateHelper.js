const buildNotificationTemplate = (key, payload = {}) => {
    switch (key) {
        case 'ORDER_PAID': {
            const { orderId, paymentMethod } = payload;
            return {
                type: 'ORDER',
                title: 'Thanh toán thành công',
                content: `Đơn hàng #${orderId} đã được thanh toán thành công qua ${paymentMethod}.`,
                referenceId: orderId,
                linkUrl: `/order-tracking?orderId=${orderId}`
            };
        }
        case 'ORDER_CREATED': { // THÊM TEMPLATE MỚI CHO THÔNG BÁO TẠO ĐƠN HÀNG
            const { orderId } = payload;
            return {
                type: 'ORDER',
                title: 'Đơn hàng của bạn đã được tạo',
                content: `Đơn hàng #${orderId} đã được tạo thành công và đang chờ xác nhận.`,
                referenceId: orderId,
                linkUrl: `/order-tracking?orderId=${orderId}`
            };
        }
        case 'ORDER_STATUS_CHANGED': {
            const { orderId, newStatus } = payload;

            //  Map nội dung thân thiện
            const statusMessageMap = {
                PENDING_CONFIRMATION: `Đơn hàng #${orderId} đang chờ xác nhận từ hệ thống.`,
                PROCESSING: `Đơn hàng #${orderId} đang được chuẩn bị.`,
                SHIPPING: `Đơn hàng #${orderId} đã được chuyển cho đơn vị vận chuyển.`,
                COMPLETED: `Đơn hàng #${orderId} đã được giao thành công. Cảm ơn bạn đã mua sắm!`,
                CANCELLED: `Đơn hàng #${orderId} đã bị hủy. Nếu có thắc mắc, vui lòng liên hệ hỗ trợ.`,
            };

            const content =
                statusMessageMap[newStatus] ||
                `Trạng thái đơn hàng #${orderId} đã được cập nhật.`;

            return {
                type: 'ORDER',
                title: 'Cập nhật trạng thái đơn hàng',
                content,
                referenceId: orderId,
                linkUrl: `/order-tracking?orderId=${orderId}`
            };
        }

        default:
            throw new Error('UNKNOWN_NOTIFICATION_TEMPLATE');
    }
};

module.exports = { buildNotificationTemplate };