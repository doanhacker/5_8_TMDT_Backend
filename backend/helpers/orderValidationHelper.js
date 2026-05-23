/**
 * Các loại đơn hàng hợp lệ.
 * ENUM('NORMAL', 'PRE_ORDER')
 */
const VALID_ORDER_TYPES = ['NORMAL', 'PRE_ORDER'];

/**
 * Các trạng thái đơn hàng hợp lệ.
 * ENUM('PENDING_CONFIRMATION', 'WAITING_FOR_STOCK', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED')
 */
const VALID_ORDER_STATUSES = ['PENDING_CONFIRMATION', 'WAITING_FOR_STOCK', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];


/**
 * Validate dữ liệu cho một mục trong chi tiết đơn hàng (order item)
 * @param {Object} data - Dữ liệu của item (variant_id, quantity, price_at_purchase)
 * @returns {string[]} Mảng lỗi (rỗng nếu hợp lệ)
 */
const validateOrderItemData = (data) => {
    const { variant_id, quantity} = data;
    const errors = [];

    if (variant_id === undefined || isNaN(parseInt(variant_id)) || parseInt(variant_id) <= 0) {
        errors.push('ID phiên bản sản phẩm không hợp lệ.');
    }
    if (quantity === undefined || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
        errors.push('Số lượng sản phẩm phải là số nguyên dương.');
    }
    return errors;
};

/**
 * Validate dữ liệu cho việc tạo đơn hàng
 * @param {Object} data - Dữ liệu từ req.body
 * @returns {string[]} Mảng lỗi (rỗng nếu hợp lệ)
 */
const validateOrderCreationData = (data) => {
    const { user_id, address_id, order_type, items } = data;
    const errors = [];

    if (!user_id || isNaN(parseInt(user_id)) || parseInt(user_id) <= 0) {
        errors.push('ID người dùng không hợp lệ.');
    }
    if (address_id !== undefined && address_id !== null && (isNaN(parseInt(address_id)) || parseInt(address_id) <= 0)) {
        errors.push('ID địa chỉ không hợp lệ.');
    }
    if (order_type && !VALID_ORDER_TYPES.includes(order_type)) {
        errors.push(`Loại đơn hàng phải là một trong các giá trị: ${VALID_ORDER_TYPES.join(', ')}.`);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push('Đơn hàng phải có ít nhất một sản phẩm.');
    } else {
        items.forEach((item, index) => {
            const itemErrors = validateOrderItemData(item);
            if (itemErrors.length > 0) {
                errors.push(`Lỗi chi tiết đơn hàng #${index + 1}: ${itemErrors.join(', ')}`);
            }
        });
    }

    return errors;
};

/**
 * Validate ID đơn hàng
 * @param {any} id - ID đơn hàng
 * @returns {boolean} - true nếu hợp lệ, false nếu không
 */
const isValidOrderId = (id) => !isNaN(parseInt(id)) && parseInt(id) > 0;


module.exports = {
    VALID_ORDER_TYPES,
    VALID_ORDER_STATUSES,
    validateOrderItemData,
    validateOrderCreationData,
    isValidOrderId
};