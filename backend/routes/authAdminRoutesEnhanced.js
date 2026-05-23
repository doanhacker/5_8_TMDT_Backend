const express = require('express');
const router = express.Router();
const authAdminController = require('../controllers/authAdminController');
const adminManagementController = require('../controllers/adminManagementController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Tất cả route trong này đều yêu cầu phải là admin đã đăng nhập
router.use(verifyToken, verifyAdmin);
/**
 * @route GET /api/auth/admin/users
 * @description Lấy danh sách người dùng hệ thống (admin, staff)
 * @role admin only
 */
router.get('/users', authAdminController.getSystemUsers);

/**
 * @route POST /api/auth/admin/users
 * @description Tạo tài khoản nhân viên mới
 * @body { name, email, phone, password, role }
 * @role admin chỉ
 */
router.post('/users', authAdminController.createStaff);

router.get('/customers', adminManagementController.getCustomers);
router.patch('/customers/:id/status', adminManagementController.updateCustomerStatus);

router.get('/reviews', adminManagementController.getProductReviews);
router.delete('/reviews/:id', adminManagementController.deleteProductReview);

module.exports = router;
