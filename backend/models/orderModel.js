const db = require('../config/db');
const { getSafeSort, getOffset, buildPaginationResult } = require('../helpers/queryHelper');
const { VALID_ORDER_TYPES, VALID_ORDER_STATUSES } = require('../helpers/orderValidationHelper');
const notificationService = require('../services/notificationService');

const ALLOWED_SORT_FIELDS = {
    order_id: 'o.order_id',
    order_date: 'o.order_date',
    total_amount: 'o.total_amount',
    status: 'o.status',
    user_id: 'o.user_id',
    full_name: 'u.full_name'
};

const Order = {
    /**
     * Tạo một đơn hàng mới (bình thường hoặc đặt trước), tính toán tổng tiền, áp dụng voucher, giảm tồn kho và lưu chi tiết đơn hàng.
     * @param {Object} orderData - Dữ liệu đơn hàng chính (user_id, address_id, voucher_id, order_type, estimated_delivery_date)
     * @param {Array<Object>} items - Mảng các sản phẩm trong đơn hàng ({ variant_id, quantity })
     * @returns {Promise<number>} ID của đơn hàng vừa được tạo.
     */
    createOrder: async (orderData, items) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { user_id, address_id, voucher_id, order_type = 'NORMAL', estimated_delivery_date } = orderData;
            let subtotal = 0;
            let shipping_fee = 0; // Tạm thời là 0
            let discount_amount = 0;

            const orderDetailsToInsert = [];
            
            // 1. Kiểm tra tồn kho và tính subtotal
            for (const item of items) {
                const [variantRows] = await connection.query(
                    'SELECT pv.original_price, pv.discount_price, pv.stock_quantity, pv.status FROM product_variants pv WHERE pv.variant_id = ? FOR UPDATE', // LOCK row
                    [item.variant_id]
                );

                if (variantRows.length === 0) {
                    throw new Error(`Phiên bản sản phẩm với ID ${item.variant_id} không tồn tại.`);
                }
                const variant = variantRows[0];

                const currentPrice = variant.discount_price !== null ? variant.discount_price : variant.original_price;

                // Kiểm tra trạng thái và tồn kho cho đơn hàng bình thường
                if (order_type === 'NORMAL') {
                    if (variant.status !== 'IN_STOCK') {
                        throw new Error(`Phiên bản sản phẩm ID ${item.variant_id} không có sẵn để đặt hàng.`);
                    }
                    if (variant.stock_quantity < item.quantity) {
                        throw new Error(`Số lượng tồn kho của phiên bản ID ${item.variant_id} không đủ. Chỉ còn ${variant.stock_quantity} sản phẩm.`);
                    }
                    // Giảm tồn kho ngay cho đơn hàng NORMAL
                    await connection.query('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE variant_id = ?', [item.quantity, item.variant_id]);
                }
                // Đối với PRE_ORDER, không giảm tồn kho ở bước này, status sẽ là WAITING_FOR_STOCK
                
                subtotal += currentPrice * item.quantity;
                orderDetailsToInsert.push({
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    price_at_purchase: currentPrice
                });
            }

            // 2. Áp dụng Voucher (nếu có)
            let voucher = null;
            if (voucher_id) {
                const [voucherRows] = await connection.query(
                    'SELECT voucher_id, discount_type, discount_value, max_discount_amount, min_order_value, remaining_quantity FROM vouchers WHERE voucher_id = ? AND expiration_date > NOW() AND remaining_quantity > 0 FOR UPDATE', // LOCK row
                    [voucher_id]
                );
                if (voucherRows.length === 0) {
                    throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn/số lượng.');
                }
                voucher = voucherRows[0];

                if (subtotal < voucher.min_order_value) {
                    throw new Error(`Tổng giá trị đơn hàng phải đạt tối thiểu ${voucher.min_order_value} để áp dụng mã giảm giá này.`);
                }

                if (voucher.discount_type === 'PERCENTAGE') {
                    discount_amount = subtotal * (voucher.discount_value / 100);
                    // Áp dụng max_discount_amount nếu có
                    if (voucher.max_discount_amount !== null && discount_amount > voucher.max_discount_amount) {
                        discount_amount = voucher.max_discount_amount;
                    }
                } else if (voucher.discount_type === 'FIXED_AMOUNT') {
                    discount_amount = voucher.discount_value;
                    // max_discount_amount không áp dụng cho FIXED_AMOUNT, nhưng có thể muốn giới hạn discount_value không vượt quá subtotal
                    if (discount_amount > subtotal) {
                        discount_amount = subtotal; // Không giảm quá tổng tiền
                    }
                }
                
                // Giảm số lượng voucher còn lại
                await connection.query('UPDATE vouchers SET remaining_quantity = remaining_quantity - 1 WHERE voucher_id = ?', [voucher_id]);
            }

            const total_amount = subtotal - discount_amount + shipping_fee;

            // Xác định trạng thái ban đầu
            let initialStatus = 'PENDING_CONFIRMATION';
            if (order_type === 'PRE_ORDER') {
                initialStatus = 'WAITING_FOR_STOCK';
            }

            // 3. Thêm đơn hàng chính
            const orderInsertQuery = `
                INSERT INTO orders
                (user_id, address_id, voucher_id, order_type, status, subtotal, shipping_fee, discount_amount, total_amount, estimated_delivery_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const orderValues = [
                user_id,
                address_id || null,
                voucher_id || null,
                order_type,
                initialStatus,
                subtotal,
                shipping_fee,
                discount_amount,
                total_amount,
                estimated_delivery_date || null
            ];
            const [orderResult] = await connection.query(orderInsertQuery, orderValues);
            const newOrderId = orderResult.insertId;

            // 4. Thêm chi tiết đơn hàng
            const orderDetailInsertQuery = `
                INSERT INTO order_details
                (order_id, variant_id, quantity, price_at_purchase)
                VALUES (?, ?, ?, ?)
            `;
            for (const detail of orderDetailsToInsert) {
                await connection.query(orderDetailInsertQuery, [
                    newOrderId,
                    detail.variant_id,
                    detail.quantity,
                    detail.price_at_purchase
                ]);
            }

            await connection.commit();
            return newOrderId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Lấy danh sách đơn hàng.
     * @param {Object} options - Tùy chọn lọc, sắp xếp, phân trang.
     * @param {number|null} userId - Lọc theo ID người dùng (nếu có).
     * @param {string|null} status - Lọc theo trạng thái đơn hàng.
     * @param {string|null} orderType - Lọc theo loại đơn hàng.
     * @returns {Promise<Object>} Danh sách đơn hàng với phân trang.
     */
    getAllOrders: async ({ userId, status, orderType, page, limit, search, sortBy, sortOrder }) => {
        const conditions = [];
        const values = [];

        let query = `
            SELECT
                o.order_id,
                o.user_id,
                u.full_name AS customer_name,
                o.address_id,
                ua.specific_address,
                ua.ward, ua.district, ua.province,
                o.voucher_id,
                v.voucher_code,
                o.order_type,
                o.status,
                o.subtotal,
                o.shipping_fee,
                o.discount_amount,
                o.total_amount,
                o.order_date,
                o.estimated_delivery_date
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            LEFT JOIN user_addresses ua ON o.address_id = ua.address_id
            LEFT JOIN vouchers v ON o.voucher_id = v.voucher_id
            WHERE 1=1
        `;

        if (userId) {
            conditions.push('o.user_id = ?');
            values.push(userId);
        }
        if (status && VALID_ORDER_STATUSES.includes(status.toUpperCase())) {
            conditions.push('o.status = ?');
            values.push(status.toUpperCase());
        }
        if (orderType && VALID_ORDER_TYPES.includes(orderType.toUpperCase())) {
            conditions.push('o.order_type = ?');
            values.push(orderType.toUpperCase());
        }
        if (search) { // Tìm theo tên khách hàng hoặc order_id
            conditions.push('(u.full_name LIKE ? OR o.order_id LIKE ?)');
            values.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = conditions.length > 0 ? ` AND ${conditions.join(' AND ')}` : '';

        const { safeSortBy, safeSortOrder } = getSafeSort(sortBy, sortOrder, ALLOWED_SORT_FIELDS, 'o.order_date');
        const offset = getOffset(page, limit);

        const [[rows], [[countResult]]] = await Promise.all([
            db.query(
                `${query} ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
                [...values, limit, offset]
            ),
            db.query(
                `SELECT COUNT(*) AS total FROM orders o LEFT JOIN users u ON o.user_id = u.user_id ${whereClause}`,
                values
            )
        ]);

        return buildPaginationResult(rows, countResult.total, page, limit);
    },

    /**
     * Lấy chi tiết một đơn hàng theo ID.
     * @param {number} orderId - ID của đơn hàng.
     * @returns {Promise<Object|null>} Đối tượng đơn hàng cùng chi tiết sản phẩm, hoặc null.
     */
    getOrderById: async (orderId) => {
        // 1. Lấy thông tin đơn hàng chính
        const orderQuery = `
            SELECT
                o.order_id,
                o.user_id,
                u.full_name AS customer_name,
                o.address_id,
                ua.receiver_name, ua.receiver_phone, ua.specific_address,
                ua.ward, ua.district, ua.province,
                o.voucher_id,
                v.voucher_code,
                v.discount_type,
                v.discount_value,
                o.order_type,
                o.status,
                o.subtotal,
                o.shipping_fee,
                o.discount_amount,
                o.total_amount,
                o.order_date,
                o.estimated_delivery_date
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            LEFT JOIN user_addresses ua ON o.address_id = ua.address_id
            LEFT JOIN vouchers v ON o.voucher_id = v.voucher_id
            WHERE o.order_id = ?
        `;
        const [orderRows] = await db.query(orderQuery, [orderId]);

        if (orderRows.length === 0) {
            return null;
        }

        const order = orderRows[0];

        // 2. Lấy chi tiết các sản phẩm trong đơn hàng
        const detailsQuery = `
            SELECT
                od.id AS order_detail_id,
                od.variant_id,
                pv.sku,
                p.product_id,
                p.product_name,
                pv.color_name,
                pv.ram_gb,
                pv.storage_gb,
                od.quantity,
                od.price_at_purchase,
                COALESCE(
                    (SELECT image_url FROM product_images WHERE variant_id = pv.variant_id AND is_primary = TRUE LIMIT 1),
                    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND variant_id IS NULL AND is_primary = TRUE LIMIT 1),
                    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND variant_id IS NULL ORDER BY image_id ASC LIMIT 1),
                    (SELECT image_url FROM product_images WHERE variant_id = pv.variant_id ORDER BY image_id ASC LIMIT 1)
                ) AS primary_variant_image_url
            FROM order_details od
            JOIN product_variants pv ON od.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            WHERE od.order_id = ?
        `;
        const [detailsRows] = await db.query(detailsQuery, [orderId]);
        order.details = detailsRows;

        return order;
    },

    /**
     * Cập nhật trạng thái của đơn hàng.
     * @param {number} orderId - ID của đơn hàng.
     * @param {string} newStatus - Trạng thái mới.
     * @param {Date|null} estimatedDeliveryDate - Ngày giao hàng dự kiến (nếu trạng thái là 'SHIPPING').
     * @param {Object} connection - Đối tượng connection nếu đang trong transaction.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    updateOrderStatus: async (orderId, newStatus, estimatedDeliveryDate = null, connection = db) => {
        if (!VALID_ORDER_STATUSES.includes(newStatus)) {
            throw new Error(`Trạng thái "${newStatus}" không hợp lệ.`);
        }

        const [orderRows] = await connection.query('SELECT user_id, status, order_type, voucher_id FROM orders WHERE order_id = ? FOR UPDATE', [orderId]);
        if (orderRows.length === 0) {
            throw new Error('Đơn hàng không tồn tại.');
        }
        const currentOrder = orderRows[0];
        const userId = currentOrder.user_id;

        // Logic chuyển trạng thái
        // Ví dụ: Không thể chuyển từ COMPLETED về PENDING
        // PENDING_CONFIRMATION -> PROCESSING -> SHIPPING -> COMPLETED
        // PENDING_CONFIRMATION -> CANCELLED
        // WAITING_FOR_STOCK -> PENDING_CONFIRMATION (khi có hàng) -> ...

        // Kiểm tra hủy đơn hàng cho khách
        if (newStatus === 'CANCELLED') {
             // Chỉ cho phép hủy nếu trạng thái hiện tại là PENDING_CONFIRMATION hoặc WAITING_FOR_STOCK
            if (!['PENDING_CONFIRMATION', 'WAITING_FOR_STOCK'].includes(currentOrder.status)) {
                throw new Error('Không thể hủy đơn hàng đã ở trạng thái xử lý, đang giao hoặc hoàn thành.');
            }
            // Logic hoàn trả voucher/tồn kho
            // Hoàn lại voucher nếu có
            if (currentOrder.voucher_id) {
                await connection.query('UPDATE vouchers SET remaining_quantity = remaining_quantity + 1 WHERE voucher_id = ?', [currentOrder.voucher_id]);
            }
            // Hoàn lại tồn kho cho đơn hàng NORMAL (nếu đã trừ khi tạo đơn)
            if (currentOrder.order_type === 'NORMAL') {
                 const [details] = await connection.query('SELECT variant_id, quantity FROM order_details WHERE order_id = ?', [orderId]);
                 for (const detail of details) {
                     await connection.query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE variant_id = ?', [detail.quantity, detail.variant_id]);
                 }
            }
        }
        
        // Logic cho PRE_ORDER khi hàng về
        if (currentOrder.order_type === 'PRE_ORDER' && currentOrder.status === 'WAITING_FOR_STOCK' && newStatus === 'PENDING_CONFIRMATION') {
            // Khi đơn đặt trước chuyển từ WAITING_FOR_STOCK sang PENDING_CONFIRMATION
            // Giả định lúc này hàng đã về, cần trừ tồn kho
            const [details] = await connection.query('SELECT variant_id, quantity FROM order_details WHERE order_id = ?', [orderId]);
            for (const detail of details) {
                // Kiểm tra lại tồn kho trước khi trừ
                const [variantStock] = await connection.query('SELECT stock_quantity FROM product_variants WHERE variant_id = ? FOR UPDATE', [detail.variant_id]);
                if (variantStock.length === 0 || variantStock[0].stock_quantity < detail.quantity) {
                    throw new Error(`Không đủ tồn kho cho phiên bản sản phẩm ID ${detail.variant_id} để xác nhận đơn đặt trước.`);
                }
                await connection.query('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE variant_id = ?', [detail.quantity, detail.variant_id]);
            }
        }


        const setClauses = ['status = ?'];
        const values = [newStatus];

        if (newStatus === 'SHIPPING' && estimatedDeliveryDate) {
            setClauses.push('estimated_delivery_date = ?');
            values.push(estimatedDeliveryDate);
        } else if (newStatus !== 'SHIPPING' && currentOrder.status === 'SHIPPING') {
            // Nếu chuyển khỏi SHIPPING, xóa ngày giao dự kiến (hoặc giữ lại tùy ý)
            setClauses.push('estimated_delivery_date = NULL');
        }

        values.push(orderId);
        const [result] = await connection.query(
            `UPDATE orders SET ${setClauses.join(', ')} WHERE order_id = ?`,
            values
        );
        const affectedRows = result.affectedRows;

        // Gửi thông báo real-time nếu trạng thái thực sự thay đổi
        if (affectedRows > 0 && currentOrder.status !== newStatus) {
            await notificationService.notifyOrderStatusChange(orderId, userId, currentOrder.status, newStatus, connection);
        }

        return affectedRows;
    },

    /**
     * Cập nhật địa chỉ giao hàng cho đơn trước khi vào xử lý.
     * @param {number} orderId - ID đơn hàng.
     * @param {number} userId - ID người dùng sở hữu đơn.
     * @param {number} newAddressId - ID địa chỉ mới.
     * @param {Object} connection - Đối tượng connection nếu đang trong transaction.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    updateOrderAddress: async (orderId, userId, newAddressId, connection = db) => {
        const [orderRows] = await connection.query(
            'SELECT order_id, user_id, status FROM orders WHERE order_id = ? FOR UPDATE',
            [orderId]
        );

        if (orderRows.length === 0) {
            throw new Error('Đơn hàng không tồn tại.');
        }

        const currentOrder = orderRows[0];
        if (parseInt(currentOrder.user_id, 10) !== parseInt(userId, 10)) {
            throw new Error('Bạn không có quyền cập nhật địa chỉ cho đơn hàng này.');
        }

        if (!['PENDING_CONFIRMATION', 'WAITING_FOR_STOCK'].includes(currentOrder.status)) {
            throw new Error('Chỉ có thể đổi địa chỉ khi đơn hàng chưa vào trạng thái xử lý.');
        }

        const [addressRows] = await connection.query(
            'SELECT address_id FROM user_addresses WHERE address_id = ? AND user_id = ? LIMIT 1',
            [newAddressId, userId]
        );

        if (addressRows.length === 0) {
            throw new Error('Địa chỉ giao hàng không tồn tại hoặc không thuộc về người dùng này.');
        }

        const [result] = await connection.query(
            'UPDATE orders SET address_id = ? WHERE order_id = ?',
            [newAddressId, orderId]
        );

        return result.affectedRows;
    },

    /**
     * Cập nhật payment_id cho đơn hàng.
     * @param {number} orderId - ID của đơn hàng.
     * @param {number} paymentId - ID của payment record.
     * @param {Object} connection - Đối tượng connection nếu đang trong transaction.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    updateOrderPaymentId: async (orderId, paymentId, connection = db) => {
        const [result] = await connection.query(
            'UPDATE orders SET payment_id = ? WHERE order_id = ?',
            [paymentId, orderId]
        );
        return result.affectedRows;
    }
};

module.exports = Order;
