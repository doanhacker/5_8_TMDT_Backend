const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/me', verifyToken, userProfileController.getMyProfile);
router.put('/me', verifyToken, userProfileController.updateMyProfile);

router.get('/me/addresses', verifyToken, userProfileController.getMyAddresses);
router.post('/me/addresses', verifyToken, userProfileController.createMyAddress);
router.put('/me/addresses/:addressId', verifyToken, userProfileController.updateMyAddress);
router.delete('/me/addresses/:addressId', verifyToken, userProfileController.deleteMyAddress);

module.exports = router;
