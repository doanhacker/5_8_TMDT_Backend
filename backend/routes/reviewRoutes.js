const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const uploadReview = require('../middlewares/uploadReviewImageMiddleware');

// GET chi tiết đánh giá theo ID (có thể xem công khai hoặc theo quyền)
router.get('/:id', reviewController.getReviewById);

// POST tạo đánh giá mới (yêu cầu đăng nhập và đã mua hàng)
router.post('/',
    verifyToken, // Yêu cầu đăng nhập
    reviewController.extractUserAndAdminStatus, // Gắn userId và isAdmin vào req
    uploadReview.array('reviewImages', 5), // Cho phép upload tối đa 5 ảnh
    reviewController.createReview
);

// PUT cập nhật đánh giá (yêu cầu đăng nhập, chỉ người đánh giá hoặc Admin)
router.put('/:id',
    verifyToken, // Yêu cầu đăng nhập
    reviewController.extractUserAndAdminStatus, // Gắn userId và isAdmin vào req
    uploadReview.array('reviewImages', 5), // Cho phép upload thêm/thay thế ảnh
    reviewController.updateReview
);

// Admin có thể hard delete review (nếu cần, nhưng thường dùng soft delete)
// router.delete('/:id/hard-delete', verifyToken, verifyAdmin, reviewController.hardDeleteReview);

module.exports = router;