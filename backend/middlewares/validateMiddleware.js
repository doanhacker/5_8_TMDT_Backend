/**
 * ================================================================
 * VALIDATE MIDDLEWARE — Chỉ là "adapter" mỏng giữa Express và Helper
 *
 * KHÔNG chứa logic validate
 * Chỉ: gọi helper → nếu lỗi thì trả response, không thì next()
 * ================================================================
 */
const {
    checkMissingFields,
    isPositiveInteger,
    validateItems,
    validatePaginationParams
} = require('../helpers/validateHelper');  // ✅ Gọi helper

// ================================================================
// [1] Validate các field bắt buộc trong req.body
// ================================================================
const validateRequiredFields = (fields) => (req, res, next) => {
    const missing = checkMissingFields(req.body, fields);  // ✅ Gọi helper

    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Thiếu các trường bắt buộc: ${missing.join(', ')}`,
            missing_fields: missing
        });
    }

    next();
};

// ================================================================
// [2] Validate route param là số nguyên dương
// ================================================================
const validateParamId = (paramName = 'id') => (req, res, next) => {
    if (!isPositiveInteger(req.params[paramName])) {  // ✅ Gọi helper
        return res.status(400).json({
            success: false,
            message: `${paramName} phải là số nguyên dương`
        });
    }

    // ✅ Parse sạch để controller nhận số thay vì string
    req.params[paramName] = parseInt(req.params[paramName]);
    next();
};

// ================================================================
// [3] Validate items array
// ================================================================
const validateOrderItems = (req, res, next) => {
    const result = validateItems(req.body.items);   // ✅ Gọi helper

    if (!result.valid) {
        return res.status(400).json({
            success: false,
            message: result.error
        });
    }

    // ✅ Parse lại items sạch để controller nhận số thay vì string
    req.body.items = req.body.items.map(item => ({
        ...item,
        variant_id: parseInt(item.variant_id),
        quantity:   parseInt(item.quantity)
    }));

    next();
};

// ================================================================
// [4] Validate pagination query params
// ================================================================
const validatePagination = (req, res, next) => {
    const result = validatePaginationParams(req.query);  // ✅ Gọi helper

    if (!result.valid) {
        return res.status(400).json({
            success: false,
            message: result.error
        });
    }

    next();
};

module.exports = {
    validateRequiredFields,
    validateParamId,
    validateOrderItems,
    validatePagination
};