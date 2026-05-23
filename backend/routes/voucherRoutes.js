const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');

// ⚠️ /check/:code phải đặt TRƯỚC /:id
// vì Express khớp route theo thứ tự từ trên xuống
// nếu /:id đặt trước → "check" sẽ bị hiểu là một ID
router.get('/check/:code', voucherController.checkByCode);

router.get('/',     voucherController.getAll);
router.get('/:id',  voucherController.getById);
router.post('/',    voucherController.create);
router.put('/:id',  voucherController.update);
router.delete('/:id', voucherController.delete);

module.exports = router;