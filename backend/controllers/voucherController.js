const Voucher = require('../models/voucherModel');
const { parseQueryParams }                              = require('../helpers/queryHelper');   // ✅ Import helper
const { validateVoucherData, normalizeVoucherCode, isValidVoucherCodeFormat } = require('../helpers/voucherHelper'); // ✅ Import helper

const voucherController = {

    getAll: async (req, res) => {
        try {
            const params = parseQueryParams(req.query, { defaultSortBy: 'expiration_date' }); // ✅ Dùng helper
            const result = await Voucher.getAll(params);
            return res.status(200).json({ success: true, message: 'Lấy danh sách voucher thành công', ...result });
        } catch (error) {
            console.error('[Voucher.getAll]', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    getById: async (req, res) => {
        try {
            const voucher = await Voucher.getById(req.params.id);
            if (!voucher) return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
            return res.status(200).json({ success: true, data: voucher });
        } catch (error) {
            console.error('[Voucher.getById]', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    checkByCode: async (req, res) => {
        try {
            const code = normalizeVoucherCode(req.params.code); // ✅ Dùng helper
            if (!code || !isValidVoucherCodeFormat(code)) {     // ✅ Dùng helper
                return res.status(400).json({ success: false, message: 'Mã voucher không hợp lệ' });
            }
            const voucher = await Voucher.getByCode(code);
            if (!voucher) return res.status(404).json({ success: false, message: 'Mã voucher không tồn tại hoặc đã hết hạn' });
            return res.status(200).json({ success: true, message: 'Mã voucher hợp lệ', data: voucher });
        } catch (error) {
            console.error('[Voucher.checkByCode]', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    create: async (req, res) => {
        try {
            if (req.body.voucher_code) {
                req.body.voucher_code = normalizeVoucherCode(req.body.voucher_code); // ✅ Dùng helper
            }

            if (req.body.max_discount_amount !== undefined && req.body.max_discount_amount !== null) {
                req.body.max_discount_amount = parseFloat(req.body.max_discount_amount);
                if (isNaN(req.body.max_discount_amount)) req.body.max_discount_amount = null; // Set null nếu không phải số
            } else {
                req.body.max_discount_amount = null; // Mặc định là null nếu không gửi
            }

            const errors = validateVoucherData(req.body, false); // ✅ Dùng helper
            if (errors.length > 0) return res.status(400).json({ success: false, message: errors[0], errors });

            const newId = await Voucher.create(req.body);
            return res.status(201).json({ success: true, message: 'Tạo voucher thành công', data: { voucher_id: newId } });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Mã voucher đã tồn tại' });
            console.error('[Voucher.create]', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const existing = await Voucher.getById(id);
            if (!existing) return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });

            if (req.body.voucher_code) {
                req.body.voucher_code = normalizeVoucherCode(req.body.voucher_code); // ✅ Dùng helper
            }

            if (req.body.max_discount_amount !== undefined && req.body.max_discount_amount !== null) {
                req.body.max_discount_amount = parseFloat(req.body.max_discount_amount);
                if (isNaN(req.body.max_discount_amount)) req.body.max_discount_amount = null;
            } else if (req.body.max_discount_amount === '') { // Xử lý nếu gửi chuỗi rỗng
                req.body.max_discount_amount = null;
            }
            
            const errors = validateVoucherData(req.body, true); // ✅ Dùng helper
            if (errors.length > 0) return res.status(400).json({ success: false, message: errors[0], errors });

            const affectedRows = await Voucher.update(id, req.body);
            if (affectedRows === 0) return res.status(400).json({ success: false, message: 'Không có thay đổi nào được lưu' });

            return res.status(200).json({ success: true, message: 'Cập nhật voucher thành công' });
        } catch (error) {
            if (error.message === 'NO_FIELDS_TO_UPDATE') return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ít nhất một trường để cập nhật' });
            if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Mã voucher đã tồn tại' });
            console.error('[Voucher.update]', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    delete: async (req, res) => {
        try {
            const existing = await Voucher.getById(req.params.id);
            if (!existing) return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });

            await Voucher.delete(req.params.id);
            return res.status(200).json({ success: true, message: 'Xóa voucher thành công' });
        } catch (error) {
            console.error('[Voucher.delete]', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    }
};

module.exports = voucherController;