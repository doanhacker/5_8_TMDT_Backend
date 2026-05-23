const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AdminCustomerModel = require('../models/adminCustomerModel');
const AdminReviewModel = require('../models/adminReviewModel');

const getBearerToken = (authorizationHeader = '') => {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) return null;
    return authorizationHeader.slice(7);
};

const ensureAdminAccess = async (req, res) => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
        res.status(401).json({ success: false, message: 'Thiếu token xác thực' });
        return null;
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
        return null;
    }

    const roles = await User.getUserRoles(payload.user_id);
    const isAdmin = roles.some((role) => String(role.role_name || '').toLowerCase() === 'admin');
    if (!isAdmin) {
        res.status(403).json({ success: false, message: 'Nhân viên không có quyền sử dụng chức năng này' });
        return null;
    }

    return payload;
};

const adminManagementController = {
    getCustomers: async (req, res) => {
        try {
            const authUser = await ensureAdminAccess(req, res);
            if (!authUser) return;

            const customers = await AdminCustomerModel.getAllCustomersWithStats();
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách khách hàng thành công',
                data: customers
            });
        } catch (error) {
            console.error('Error getCustomers:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách khách hàng' });
        }
    },

    updateCustomerStatus: async (req, res) => {
        try {
            const authUser = await ensureAdminAccess(req, res);
            if (!authUser) return;

            const userId = Number(req.params.id);
            const status = String(req.body.status || '').toUpperCase();

            if (!userId || userId <= 0) {
                return res.status(400).json({ success: false, message: 'ID khách hàng không hợp lệ' });
            }
            if (!['ACTIVE', 'LOCKED'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Trạng thái chỉ chấp nhận ACTIVE hoặc LOCKED' });
            }

            const affectedRows = await AdminCustomerModel.updateCustomerStatus(userId, status);
            if (!affectedRows) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng để cập nhật' });
            }

            res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái khách hàng thành công',
                data: { user_id: userId, status }
            });
        } catch (error) {
            console.error('Error updateCustomerStatus:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái khách hàng' });
        }
    },

    getProductReviews: async (req, res) => {
        try {
            const authUser = await ensureAdminAccess(req, res);
            if (!authUser) return;

            const reviews = await AdminReviewModel.getAllReviews();
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách đánh giá thành công',
                data: reviews
            });
        } catch (error) {
            console.error('Error getProductReviews:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đánh giá' });
        }
    },

    deleteProductReview: async (req, res) => {
        try {
            const authUser = await ensureAdminAccess(req, res);
            if (!authUser) return;

            const reviewId = Number(req.params.id);
            if (!reviewId || reviewId <= 0) {
                return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ' });
            }

            const affectedRows = await AdminReviewModel.deleteReviewById(reviewId);
            if (!affectedRows) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá để xóa' });
            }

            res.status(200).json({
                success: true,
                message: 'Đã xóa đánh giá thành công',
                data: { review_id: reviewId }
            });
        } catch (error) {
            console.error('Error deleteProductReview:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi xóa đánh giá' });
        }
    }
};

module.exports = adminManagementController;
