const express = require('express');
const usedTradeInController = require('../controllers/usedTradeInController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const uploadProduct = require('../middlewares/uploadProductImageMiddleware');

const router = express.Router();

router.get('/items', usedTradeInController.getUsedItems);
router.get('/items/:id', usedTradeInController.getUsedItemById);
router.post('/requests', usedTradeInController.createTradeInRequest);

router.post('/items/upload-image', verifyToken, verifyAdmin, uploadProduct.single('image'), usedTradeInController.uploadUsedItemImage);
router.post('/items', verifyToken, verifyAdmin, usedTradeInController.createUsedItem);
router.put('/items/:id', verifyToken, verifyAdmin, usedTradeInController.updateUsedItem);
router.delete('/items/:id', verifyToken, verifyAdmin, usedTradeInController.deleteUsedItem);

router.get('/requests', verifyToken, verifyAdmin, usedTradeInController.getTradeInRequests);
router.put('/requests/:id/status', verifyToken, verifyAdmin, usedTradeInController.updateTradeInRequestStatus);

module.exports = router;
