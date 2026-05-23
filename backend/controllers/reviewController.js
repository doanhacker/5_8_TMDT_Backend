const Review = require('../models/reviewModel');
const Product = require('../models/productModel'); // Để lấy thông tin sản phẩm và variant
const { validateReviewData } = require('../helpers/reviewValidationHelper');
const { isValidId } = require('../helpers/productValidationHelper');
const { getUserIdFromToken } = require('../socket/realtime'); // Dùng để lấy userId từ token trong verifyToken
const notificationService = require('../services/notificationService'); // Để gửi thông báo admin
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Cần import middleware upload ảnh
const uploadReview = require('../middlewares/uploadReviewImageMiddleware');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware'); // Thêm verifyAdmin

const reviewController = {
    /**
     * Middleware để trích xuất User ID và Admin status từ JWT Token
     * và gắn vào req.requestingUser.
     * Hàm này được dùng trong các API yêu cầu quyền.
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */
    extractUserAndAdminStatus: async (req, res, next) => {
        try {
            const userId = req.user?.user_id;

            let isAdmin = false;
            if (userId) {
                const [rows] = await require('../config/db').query(
                    `SELECT r.role_name 
                    FROM user_roles ur
                    INNER JOIN roles r ON r.role_id = ur.role_id
                    WHERE ur.user_id = ?
                    AND UPPER(TRIM(r.role_name)) = 'ADMIN'
                    LIMIT 1`,
                    [userId]
                );
                isAdmin = rows.length > 0;
            }

            req.requestingUser = { userId, isAdmin };
            console.log('DEBUG requestingUser:', req.requestingUser);
            next();
        } catch (error) {
            console.error('[ReviewController] Error extracting user/admin status:', error);
            res.status(500).json({ success: false, message: 'Lỗi xác thực người dùng.' });
        }
    },

    /**
     * API: Lấy chi tiết đánh giá theo ID (GET /api/reviews/:id)
     * Áp dụng quyền hiển thị.
     */
    getReviewById: async (req, res) => {
        try {
            const { id } = req.params;
            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ.' });
            }

            // Lấy userId và isAdmin từ token nếu người dùng đã đăng nhập
            const token = req.headers.authorization?.split(' ')[1];
            let requestingUserId = null;
            let isAdmin = false;

            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    requestingUserId = decoded.user_id || decoded.id || decoded.userId;
                    // Để có isAdmin, cần lưu role trong token hoặc fetch từ DB
                    // Tạm thời giả định có role_name trong decoded
                    // if (decoded.role_name === 'ADMIN') isAdmin = true;
                    // Hoặc kiểm tra qua DB nếu không lưu role trong token
                    const userRoles = await User.getUserRoles(requestingUserId); // Cần import User Model
                    if (userRoles.some(r => r.role_name === 'ADMIN')) isAdmin = true;


                } catch (e) {
                    console.warn('Invalid token for review access:', e.message);
                    // Token không hợp lệ, coi như người dùng chưa đăng nhập
                    requestingUserId = null;
                    isAdmin = false;
                }
            }


            const review = await Review.getById(id, requestingUserId, isAdmin);

            if (!review) {
                return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại hoặc bạn không có quyền xem.' });
            }

            res.status(200).json({
                success: true,
                message: 'Lấy chi tiết đánh giá thành công',
                data: review
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết đánh giá:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },


    /**
     * API: Tạo đánh giá mới (POST /api/reviews)
     * Yêu cầu: đã mua sản phẩm và đơn hàng COMPLETED.
     */
    createReview: async (req, res) => {
        try {
            const { userId } = req.requestingUser; // Lấy từ middleware verifyToken
            const { product_id, variant_id, rating, content } = req.body;

            // 1. Validate dữ liệu đầu vào
            const reviewErrors = validateReviewData({ product_id, rating, content });
            if (reviewErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu đánh giá', errors: reviewErrors });
            }
            if (!isValidId(variant_id)) {
                 return res.status(400).json({ success: false, message: 'ID phiên bản sản phẩm không hợp lệ.' });
            }


            // 2. Kiểm tra điều kiện nghiệp vụ: Người dùng đã mua và nhận hàng chưa
            const hasPurchased = await Review.hasUserPurchasedAndReceived(userId, variant_id);
            if (!hasPurchased) {
                return res.status(403).json({ success: false, message: 'Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng.' });
            }

            // 3. Xử lý ảnh upload
            const imageUrls = req.files ? req.files.map(file => file.path) : [];
            // if (imageUrls.length === 0) { // Tùy chọn: bắt buộc có ảnh
            //     return res.status(400).json({ success: false, message: 'Vui lòng upload ít nhất một ảnh cho đánh giá.' });
            // }

            const reviewData = {
                product_id: parseInt(product_id),
                user_id: userId,
                rating: parseInt(rating),
                content: content || null
            };

            const newReviewId = await Review.create(reviewData, imageUrls);

            // 4. Gửi thông báo đến admin về đánh giá mới
            await notificationService.adminSendToAllActiveUsers({
                title: `Đánh giá mới cho sản phẩm #${product_id}`,
                content: `Người dùng ${userId} vừa gửi đánh giá ${rating} sao.`,
                type: 'PRODUCT', // Hoặc REVIEW
                referenceId: newReviewId,
                linkUrl: `/admin/reviews/${newReviewId}` // Admin route để xem/quản lý đánh giá
            });

            res.status(201).json({
                success: true,
                message: 'Gửi đánh giá thành công! Cảm ơn bạn đã đóng góp.',
                data: { review_id: newReviewId, product_id, user_id: userId, rating, imageUrls }
            });

        } catch (error) {
            console.error('Lỗi khi tạo đánh giá:', error);
            if (error.message === 'Bạn đã có đánh giá hiển thị cho sản phẩm này. Bạn chỉ có thể sửa hoặc xóa đánh giá cũ.') {
                return res.status(409).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Cập nhật đánh giá (PUT /api/reviews/:id)
     * Chỉ người đánh giá hoặc Admin mới có quyền.
     * req.body: { rating?, content?, new_image_urls?, delete_image_ids?, status?, admin_deletion_reason? }
     */
    updateReview: async (req, res) => {
        try {
            const { id } = req.params;
            const { userId, isAdmin } = req.requestingUser; // Lấy từ middleware
            const { rating, content, delete_image_ids: deleteImageIdsString, status, admin_deletion_reason } = req.body;

            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ.' });
            }

            // Validate dữ liệu cập nhật
            const updateData = { rating, content, status, admin_deletion_reason };
            const reviewErrors = validateReviewData(updateData, true); // isUpdate = true
            if (reviewErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu cập nhật đánh giá', errors: reviewErrors });
            }

            // Xử lý delete_image_ids
            let deleteImageIds = [];
            if (deleteImageIdsString) {
                try {
                    deleteImageIds = JSON.parse(deleteImageIdsString).map(imgId => parseInt(imgId));
                    if (deleteImageIds.some(imgId => !isValidId(imgId))) {
                        return res.status(400).json({ success: false, message: 'ID ảnh cần xóa không hợp lệ.' });
                    }
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Định dạng delete_image_ids không hợp lệ.' });
                }
            }

            // Xử lý ảnh mới upload
            const newImageUrls = req.files ? req.files.map(file => file.path) : [];

            const affectedRows = await Review.update(id, userId, isAdmin, updateData, newImageUrls, deleteImageIds);

            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Không có thay đổi nào được thực hiện hoặc đánh giá không tồn tại.' });
            }

            // Gửi thông báo đến admin nếu đánh giá bị xóa/cập nhật bởi người dùng
            if (!isAdmin && (status === 'DELETED_BY_USER' || newImageUrls.length > 0 || deleteImageIds.length > 0 || rating !== undefined || content !== undefined)) {
                await notificationService.adminSendToAllActiveUsers({
                    title: `Đánh giá #${id} đã được cập nhật/xóa bởi người dùng`,
                    content: `User ${userId} đã cập nhật/xóa đánh giá cho sản phẩm. Trạng thái mới: ${status || 'VISIBLE'}.`,
                    type: 'PRODUCT',
                    referenceId: id,
                    linkUrl: `/admin/reviews/${id}`
                });
            }
            // Gửi thông báo cho người dùng nếu admin xóa đánh giá
            if (isAdmin && status === 'DELETED_BY_ADMIN') {
                const review = await Review.getById(id, null, true); // Lấy review để có userId
                if (review) {
                    await notificationService.sendToUser({
                        userId: review.user_id,
                        title: `Đánh giá của bạn đã bị Admin xóa`,
                        content: `Đánh giá của bạn cho sản phẩm #${review.product_id} đã bị Admin xóa với lý do: "${admin_deletion_reason || 'Không có'}"`,
                        type: 'SYSTEM', // Hoặc REVIEW
                        referenceId: id,
                        linkUrl: `/orders/${review.product_id}` // Hoặc link đến trang chi tiết đánh giá của họ
                    });
                }
            }


            res.status(200).json({
                success: true,
                message: 'Cập nhật đánh giá thành công!'
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật đánh giá:', error);
            // Xử lý các lỗi cụ thể từ Model
            if (error.message === 'Bạn không có quyền sửa đánh giá này.') {
                return res.status(403).json({ success: false, message: error.message });
            }
            if (error.message === 'Đánh giá không tồn tại.') {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.startsWith('INVALID_REVIEW_STATUS') || error.message.startsWith('Lý do xóa bởi Admin') || error.message.startsWith('Người dùng không thể thay đổi trạng thái')) {
                 return res.status(400).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    }
};

module.exports = reviewController;