const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const uploadMedia = require('../middlewares/uploadMediaMiddleware');

// API upload media (ảnh, video) - được dùng bởi editor
router.post('/upload', uploadMedia.single('file'), mediaController.uploadMedia);

module.exports = router;
