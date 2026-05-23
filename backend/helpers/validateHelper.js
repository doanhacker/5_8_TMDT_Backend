/**
 * ================================================================
 * VALIDATE HELPER — Pure functions, không phụ thuộc Express
 * Tái sử dụng được ở: Middleware, Controller, Model, Service...
 * ================================================================
 */

// ================================================================
// [1] Kiểm tra các field bắt buộc trong một object
//
// @param {Object}   data   - Object cần kiểm tra (thường là req.body)
// @param {string[]} fields - Danh sách field bắt buộc
// @returns {string[]}      - Danh sách field còn thiếu (rỗng = hợp lệ)
//
// Ví dụ:
//   checkMissingFields(req.body, ['order_id', 'payment_method'])
//   → ['payment_method']  nếu thiếu payment_method
// ================================================================
const checkMissingFields = (data, fields) => {
    return fields.filter(field => {
        const val = data[field];
        return val === undefined || val === null || String(val).trim() === '';
    });
};

// ================================================================
// [2] Kiểm tra một giá trị có phải số nguyên dương không
//
// @param {*}      value - Giá trị cần kiểm tra
// @returns {boolean}
//
// Ví dụ:
//   isPositiveInteger(1)     → true
//   isPositiveInteger('1')   → true   (parseInt được)
//   isPositiveInteger(-1)    → false
//   isPositiveInteger('abc') → false
//   isPositiveInteger(1.5)   → false
// ================================================================
const isPositiveInteger = (value) => {
    const parsed = parseInt(value);
    return !isNaN(parsed) && parsed > 0 && Number.isInteger(parsed);
};

// ================================================================
// [3] Kiểm tra một giá trị có nằm trong whitelist không
//
// @param {*}     value   - Giá trị cần kiểm tra
// @param {Array} allowed - Danh sách giá trị hợp lệ
// @returns {boolean}
//
// Ví dụ:
//   isInWhitelist('COD', ['COD', 'VNPAY']) → true
//   isInWhitelist('BITCOIN', ['COD'])       → false
// ================================================================
const isInWhitelist = (value, allowed) => allowed.includes(value);

// ================================================================
// [4] Validate items array (dùng cho checkout / tạo đơn hàng)
//
// @param {Array} items
// @returns {{ valid: boolean, error: string|null }}
//
// Ví dụ:
//   validateItems([{ variant_id: 1, quantity: 2 }])
//   → { valid: true, error: null }
//
//   validateItems([{ variant_id: -1, quantity: 2 }])
//   → { valid: false, error: 'items[0].variant_id phải là số nguyên dương' }
// ================================================================
const validateItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return { valid: false, error: 'Danh sách sản phẩm không hợp lệ hoặc rỗng' };
    }

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // ✅ variant_id theo cấu trúc DB mới (alter_tables_1.1.sql)
        if (!isPositiveInteger(item.variant_id)) {
            return { valid: false, error: `items[${i}].variant_id phải là số nguyên dương` };
        }

        if (!isPositiveInteger(item.quantity)) {
            return { valid: false, error: `items[${i}].quantity phải là số nguyên dương` };
        }
    }

    return { valid: true, error: null };
};

// ================================================================
// [5] Validate pagination params
//
// @param {{ page?, limit? }} query
// @returns {{ valid: boolean, error: string|null }}
// ================================================================
const validatePaginationParams = ({ page, limit } = {}) => {
    if (page !== undefined && !isPositiveInteger(page)) {
        return { valid: false, error: 'page phải là số nguyên dương' };
    }
    if (limit !== undefined && !isPositiveInteger(limit)) {
        return { valid: false, error: 'limit phải là số nguyên dương' };
    }
    return { valid: true, error: null };
};

module.exports = {
    checkMissingFields,
    isPositiveInteger,
    isInWhitelist,
    validateItems,
    validatePaginationParams
};