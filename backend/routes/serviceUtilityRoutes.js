const express = require('express');
const serviceUtilityController = require('../controllers/serviceUtilityController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', serviceUtilityController.getList);
router.get('/:id', serviceUtilityController.getById);

router.post('/', verifyToken, verifyAdmin, serviceUtilityController.create);
router.put('/:id', verifyToken, verifyAdmin, serviceUtilityController.update);
router.delete('/:id', verifyToken, verifyAdmin, serviceUtilityController.remove);

module.exports = router;
