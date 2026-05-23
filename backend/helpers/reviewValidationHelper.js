const { isValidId } = require('./productValidationHelper'); // Dùng chung isValidId

/**
 * Validate dữ liệu cho một bài đánh giá (rating, content)
 * @param {Object} data - Dữ liệu từ req.body
 * @param {boolean} isUpdate - true nếu là cập nhật
 * @returns {string[]} Mảng lỗi (rỗng nếu hợp lệ)
 */
const validateReviewData = (data, isUpdate = false) => {
    const { product_id, rating, content, admin_deletion_reason, status } = data; // Thêm status, admin_deletion_reason
    const errors = [];

    // --- Bắt buộc khi tạo mới ---
    if (!isUpdate) {
        if (!isValidId(product_id)) errors.push('ID sản phẩm không hợp lệ.');
        if (rating === undefined || isNaN(parseInt(rating))) errors.push('Số sao đánh giá không được để trống.');
    }

    // --- Validate từng field nếu có trong request ---
    if (product_id !== undefined && !isValidId(product_id)) {
        errors.push('ID sản phẩm không hợp lệ.');
    }
    if (rating !== undefined) {
        const parsedRating = parseInt(rating);
        if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            errors.push('Số sao đánh giá phải là số nguyên từ 1 đến 5.');
        }
    }
    if (content !== undefined && typeof content !== 'string') {
        errors.push('Nội dung đánh giá phải là chuỗi văn bản.');
    }
    // admin_deletion_reason chỉ cần validate khi status là DELETED_BY_ADMIN
    if (status === 'DELETED_BY_ADMIN' && (admin_deletion_reason === undefined || admin_deletion_reason.trim() === '')) {
         errors.push('Lý do xóa bởi Admin không được để trống khi trạng thái là DELETED_BY_ADMIN.');
    }
    // Status chỉ có thể là 3 giá trị cho phép
    if (status !== undefined && !['VISIBLE', 'DELETED_BY_USER', 'DELETED_BY_ADMIN'].includes(status)) {
         errors.push('Trạng thái đánh giá không hợp lệ.');
    }


    return errors;
};

module.exports = {
    validateReviewData
};