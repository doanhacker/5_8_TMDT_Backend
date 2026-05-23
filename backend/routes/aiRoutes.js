const express = require('express');
const aiController = require('../controllers/aiController');
const { verifyTokenOptional } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/history', verifyTokenOptional, aiController.history);
router.post('/chat', verifyTokenOptional, aiController.chat);

module.exports = router;
