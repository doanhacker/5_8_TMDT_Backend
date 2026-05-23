/**
 * Validate dữ liệu cho một mục trong giỏ hàng (cart item)
 * @param {Object} data - Dữ liệu của item (variant_id, quantity)
 * @returns {string[]} Mảng lỗi (rỗng nếu hợp lệ)
 */
const validateCartItemData = (data) => {
    const { variant_id, quantity } = data;
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
 * Validate ID giỏ hàng
 * @param {any} id - ID giỏ hàng
 * @returns {boolean} - true nếu hợp lệ, false nếu không
 */
const isValidCartId = (id) => !isNaN(parseInt(id)) && parseInt(id) > 0;


module.exports = {
    validateCartItemData,
    isValidCartId
};