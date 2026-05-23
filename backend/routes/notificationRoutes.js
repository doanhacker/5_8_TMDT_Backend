const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// API Khách hàng
router.get('/my', verifyToken, notificationController.getMyNotifications);
router.put('/read-all', verifyToken, notificationController.readAll);
router.put('/:id/read', verifyToken, notificationController.readOne);

// API Admin
router.post('/admin/send', verifyToken, verifyAdmin, notificationController.adminSendNotification);

module.exports = router;