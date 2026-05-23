const express = require('express');
const router = express.Router();
const sliderController = require('../controllers/sliderController');
const uploadSlider = require('../middlewares/uploadMiddleware'); // Import multer
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
// Đảm bảo lỗi upload luôn trả về JSON thay vì trang HTML mặc định.
const handleSliderUpload = (req, res, next) => {
	uploadSlider.single('image')(req, res, (err) => {
		if (err) {
			console.error('Upload slider error:', err);
			return res.status(400).json({
				success: false,
				message: err.message || 'Lỗi upload ảnh slider'
			});
		}
		next();
	});
};

router.get('/', sliderController.getAllSliders);
router.get('/admin/all', verifyToken, verifyAdmin, sliderController.getAllSlidersForAdmin);

// Khi gọi POST, nó sẽ chạy qua uploadSlider để lưu file 'image' trước, rồi mới chạy vào Controller
router.post('/', verifyToken, verifyAdmin, handleSliderUpload, sliderController.createSlider);
router.get('/:id', sliderController.getSliderById);
router.put('/:id', verifyToken, verifyAdmin, handleSliderUpload, sliderController.updateSlider);
router.delete('/:id', verifyToken, verifyAdmin, sliderController.deleteSlider);

module.exports = router;