const express = require('express');
const { verifyTokenOptional } = require('../middlewares/authMiddleware');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const communityQaController = require('../controllers/communityQaController');

const router = express.Router();

router.get('/', communityQaController.getRecentQuestions);
router.post('/', verifyTokenOptional, communityQaController.createQuestion);
router.put('/:id/answer', verifyToken, verifyAdmin, communityQaController.answerQuestion);

module.exports = router;
