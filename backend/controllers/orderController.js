const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const UserAddress = require('../models/userAddressModel');
const db = require('../config/db');
const Voucher = require('../models/voucherModel'); // Cần VoucherModel để kiểm tra voucher_id
const notificationService = require('../services/notificationService');

const { parseQueryParams, getOffset, buildPaginationResult } = require('../helpers/queryHelper');
const { isValidId } = require('../helpers/productValidationHelper'); // Dùng chung isValidId
const {
    VALID_ORDER_STATUSES,
    VALID_ORDER_TYPES,
    validateOrderCreationData,
    isValidOrderId
} = require('../helpers/orderValidationHelper');

const orderController = {
    /**
     * API: Tạo đơn hàng mới (POST /api/orders)
     * Đây là API cho cả đơn hàng NORMAL và PRE_ORDER
     * req.body: {
     *   user_id: number,
     *   address_id?: number,
     *   voucher_id?: number,
     *   order_type?: 'NORMAL' | 'PRE_ORDER',
     *   estimated_delivery_date?: string (YYYY-MM-DD),
     *   items: Array<{ variant_id: number, quantity: number }>
     * }
     */
    createOrder: async (req, res) => {
        try {
            const { user_id, address_id, voucher_id, order_type, estimated_delivery_date, items } = req.body;

            // 1. Validate dữ liệu đầu vào cơ bản
            const validationErrors = validateOrderCreationData({ user_id, address_id, order_type, items });
            if (validationErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu đơn hàng', errors: validationErrors });
            }

            // 2. Kiểm tra sự tồn tại của các ID liên quan
            // Kiểm tra User
            const user = await User.findById(user_id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
            }

            // Kiểm tra Address (nếu có)
            if (address_id) {
                const address = await UserAddress.getById(address_id);
                if (!address || address.user_id !== parseInt(user_id)) { // Đảm bảo địa chỉ thuộc về người dùng
                    return res.status(404).json({ success: false, message: 'Địa chỉ giao hàng không tồn tại hoặc không thuộc về người dùng này.' });
                }
            }

            // Kiểm tra Voucher (nếu có)
            if (voucher_id) {
                const voucher = await Voucher.getById(voucher_id);
                if (!voucher) {
                    return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại.' });
                }
            }

            // Kiểm tra từng item trong đơn hàng
            for (const item of items) {
                const exists = await Product.variantExists(item.variant_id);

                if (!exists) {
                    return res.status(404).json({
                        success: false,
                        message: `Phiên bản sản phẩm ID ${item.variant_id} trong chi tiết đơn hàng không tồn tại.`
                    });
                }
            }

            const orderDataForModel = {
                user_id: parseInt(user_id),
                address_id: address_id ? parseInt(address_id) : null,
                voucher_id: voucher_id ? parseInt(voucher_id) : null,
                order_type: order_type || 'NORMAL',
                estimated_delivery_date: estimated_delivery_date || null
            };

            const newOrderId = await Order.createOrder(orderDataForModel, items);

            await notificationService.notifyByTemplate(user_id, 'ORDER_CREATED', { orderId: newOrderId });

            res.status(201).json({
                success: true,
                message: 'Tạo đơn hàng thành công!',
                data: { order_id: newOrderId }
            });
        } catch (error) {
            console.error('Lỗi khi tạo đơn hàng:', error.message);
            res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ nội bộ khi tạo đơn hàng' });
        }
    },

    /**
     * API: Lấy danh sách đơn hàng (GET /api/orders)
     * Chỉ admin mới có thể xem tất cả. User chỉ xem đơn hàng của mình.
     * req.query: { page, limit, search, sortBy, sortOrder, status, orderType, user_id (cho Admin) }
     */
    getAllOrders: async (req, res) => {
        try {
            // Logic xác định quyền admin/user sẽ cần middleware auth.
            // Tạm thời giả định user_id có thể được truyền vào qua query cho mục đích test.
            // Admin có thể truyền user_id để xem đơn của người dùng cụ thể.
            // Nếu không có user_id trong query, lấy tất cả (cho Admin)

            const { page, limit, search, sortBy, sortOrder, status, orderType } = parseQueryParams(req.query, {
                defaultSortBy: 'order_date',
                defaultLimit: 10
            });

            // Nếu đây là API cho người dùng, userId sẽ từ token JWT
            // const userIdFromToken = req.user.user_id; // Giả sử đã có middleware auth
            const userIdFromQuery = req.query.user_id ? parseInt(req.query.user_id) : null;

            const options = {
                page, limit, search, sortBy, sortOrder, status, orderType,
                userId: userIdFromQuery // Hoặc userIdFromToken nếu có auth
            };

            const result = await Order.getAllOrders(options);

            res.status(200).json({
                success: true,
                message: 'Lấy danh sách đơn hàng thành công',
                ...result
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Lấy chi tiết đơn hàng (GET /api/orders/:id)
     * Admin có thể xem bất kỳ đơn hàng nào. User chỉ xem đơn hàng của mình.
     */
    getOrderById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidOrderId(id)) {
                return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ.' });
            }

            const order = await Order.getOrderById(id);

            if (!order) {
                return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại!' });
            }

            // Logic ủy quyền: nếu đây là API cho người dùng, chỉ cho phép xem đơn hàng của chính mình.
            // const userIdFromToken = req.user.user_id;
            // if (order.user_id !== userIdFromToken && !req.user.isAdmin) { // Giả sử req.user.isAdmin
            //     return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập đơn hàng này.' });
            // }

            res.status(200).json({
                success: true,
                message: 'Lấy chi tiết đơn hàng thành công',
                data: order
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Cập nhật trạng thái đơn hàng (PUT /api/orders/:id/status)
     * Chủ yếu dành cho Admin
     * req.body: { status: string, estimated_delivery_date?: string (YYYY-MM-DD) }
     */
    updateOrderStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status: newStatus, estimated_delivery_date } = req.body;

            if (!isValidOrderId(id)) {
                return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ.' });
            }
            if (!newStatus || !VALID_ORDER_STATUSES.includes(newStatus.toUpperCase())) {
                return res.status(400).json({ success: false, message: `Trạng thái mới không hợp lệ. Phải là một trong: ${VALID_ORDER_STATUSES.join(', ')}.` });
            }
            if (estimated_delivery_date && !/^\d{4}-\d{2}-\d{2}$/.test(estimated_delivery_date)) {
                 return res.status(400).json({ success: false, message: 'Định dạng ngày giao hàng dự kiến không hợp lệ (YYYY-MM-DD).' });
            }

            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                const affectedRows = await Order.updateOrderStatus(id, newStatus, estimated_delivery_date, connection);

                if (affectedRows === 0) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: 'Không có thay đổi nào được thực hiện hoặc đơn hàng không tồn tại.' });
                }

                await connection.commit();
                res.status(200).json({
                    success: true,
                    message: `Trạng thái đơn hàng ID ${id} đã được cập nhật thành "${newStatus}" thành công!`,
                    data: { order_id: id, new_status: newStatus }
                });
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ nội bộ khi cập nhật trạng thái đơn hàng' });
        }
    },

    /**
     * API: Cập nhật địa chỉ giao hàng cho đơn (PUT /api/orders/:id/address)
     * Chỉ cho phép khi đơn chưa vào PROCESSING.
     * req.body: { user_id: number, address_id: number }
     */
    updateOrderAddress: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, address_id } = req.body;

            if (!isValidOrderId(id)) {
                return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ.' });
            }

            if (!isValidId(user_id)) {
                return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
            }

            if (!isValidId(address_id)) {
                return res.status(400).json({ success: false, message: 'ID địa chỉ không hợp lệ.' });
            }

            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                const affectedRows = await Order.updateOrderAddress(
                    parseInt(id, 10),
                    parseInt(user_id, 10),
                    parseInt(address_id, 10),
                    connection
                );

                if (affectedRows === 0) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Không thể cập nhật địa chỉ giao hàng cho đơn hàng này.'
                    });
                }

                await connection.commit();
                res.status(200).json({
                    success: true,
                    message: 'Cập nhật địa chỉ giao hàng thành công.',
                    data: { order_id: parseInt(id, 10), address_id: parseInt(address_id, 10) }
                });
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật địa chỉ đơn hàng:', error.message);
            res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ nội bộ khi cập nhật địa chỉ đơn hàng' });
        }
    },

    /**
     * API: Hủy đơn hàng (DELETE /api/orders/:id/cancel)
     * Dành cho khách hàng với các điều kiện riêng và Admin
     */
    cancelOrder: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidOrderId(id)) {
                return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ.' });
            }

            // Admin có thể hủy bất kỳ đơn hàng nào.
            // User chỉ có thể hủy đơn hàng của chính mình và theo các quy tắc đã định.

            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                const affectedRows = await Order.updateOrderStatus(id, 'CANCELLED', null, connection);

                if (affectedRows === 0) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng. Có thể đơn hàng đã bị hủy hoặc không tồn tại.' });
                }

                await connection.commit();
                res.status(200).json({
                    success: true,
                    message: `Đơn hàng ID ${id} đã được hủy thành công!`,
                    data: { order_id: id, new_status: 'CANCELLED' }
                });
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Lỗi khi hủy đơn hàng:', error.message);
            res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ nội bộ khi hủy đơn hàng' });
        }
    }
};

module.exports = orderController;