const express = require('express');
const router = express.Router();
const uploadBrandLogo = require('../middlewares/uploadBrandLogoMiddleware');
const brandMediaController = require('../controllers/brandMediaController');

router.post('/upload-logo', uploadBrandLogo.single('logo'), brandMediaController.uploadLogo);

module.exports = router;
