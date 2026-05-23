const Brand = require('../models/brandModel');
const db = require('../config/db');
const { parseQueryParams, getOffset, buildPaginationResult } = require('../helpers/queryHelper');
const { isValidId } = require('../helpers/productValidationHelper');

const brandController = {
    /**
     * API: Lấy tất cả thương hiệu (GET /api/brands)
     */
    getAllBrands: async (req, res) => {
        try {
            const brands = await Brand.getAll();
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách thương hiệu thành công',
                data: brands
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách thương hiệu:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    // API: Lấy chi tiết thương hiệu theo ID (GET /api/brands/:id)
    getBrandById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID thương hiệu không hợp lệ.' });
            }

            const brand = await Brand.getById(id);

            if (!brand) {
                return res.status(404).json({ success: false, message: 'Thương hiệu không tồn tại!' });
            }

            res.status(200).json({
                success: true,
                message: 'Lấy chi tiết thương hiệu thành công',
                data: brand
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết thương hiệu:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Thêm mới thương hiệu (POST /api/brands)
     * req.body: { brand_name: string, logo_url?: string }
     */
    createBrand: async (req, res) => {
        try {
            const { brand_name, logo_url } = req.body;

            // Validate dữ liệu đầu vào
            const errors = Brand.validateBrandData({ brand_name, logo_url });
            if (errors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu thương hiệu', errors });
            }

            const newBrandId = await Brand.create({ brand_name, logo_url });

            res.status(201).json({
                success: true,
                message: 'Thêm thương hiệu thành công!',
                data: { brand_id: newBrandId, brand_name, logo_url }
            });
        } catch (error) {
            console.error('Lỗi khi thêm thương hiệu:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: 'Tên thương hiệu đã tồn tại.' });
            }
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Cập nhật thương hiệu (PUT /api/brands/:id)
     * req.body: { brand_name?: string, logo_url?: string }
     */
    updateBrand: async (req, res) => {
        try {
            const { id } = req.params;
            const { brand_name, logo_url } = req.body;

            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID thương hiệu không hợp lệ.' });
            }

            const existingBrand = await Brand.getById(id);
            if (!existingBrand) {
                return res.status(404).json({ success: false, message: 'Thương hiệu không tồn tại để cập nhật!' });
            }

            // Validate dữ liệu đầu vào
            const errors = Brand.validateBrandData({ brand_name, logo_url }, true); // isUpdate = true
            if (errors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu cập nhật thương hiệu', errors });
            }

            const updateData = {};
            if (brand_name !== undefined) updateData.brand_name = brand_name;
            if (logo_url !== undefined) updateData.logo_url = logo_url;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, message: 'Không có thông tin nào được cung cấp để cập nhật.' });
            }

            const affectedRows = await Brand.update(id, updateData);

            if (affectedRows === 0) {
                // Điều này có thể xảy ra nếu dữ liệu gửi lên giống hệt dữ liệu hiện có
                return res.status(200).json({ success: true, message: 'Không có thay đổi nào được thực hiện.' });
            }

            res.status(200).json({
                success: true,
                message: 'Cập nhật thương hiệu thành công!'
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật thương hiệu:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: 'Tên thương hiệu đã tồn tại.' });
            }
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    // API: Xóa thương hiệu (DELETE /api/brands/:id)
    deleteBrand: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID thương hiệu không hợp lệ.' });
            }

            const existingBrand = await Brand.getById(id);
            if (!existingBrand) {
                return res.status(404).json({ success: false, message: 'Thương hiệu không tồn tại để xóa!' });
            }

            // Kiểm tra xem có sản phẩm nào đang sử dụng thương hiệu này không
            const [productsUsingBrand] = await db.query('SELECT product_id FROM products WHERE brand_id = ? LIMIT 1', [id]);
            if (productsUsingBrand.length > 0) {
                return res.status(409).json({ success: false, message: 'Không thể xóa thương hiệu này vì có sản phẩm đang sử dụng nó.' });
            }

            const affectedRows = await Brand.remove(id);

            if (affectedRows === 0) { // Trường hợp này hiếm nếu đã kiểm tra tồn tại ở trên
                return res.status(400).json({ success: false, message: 'Không thể xóa thương hiệu.' });
            }

            res.status(200).json({
                success: true,
                message: 'Xóa thương hiệu thành công!'
            });
        } catch (error) {
            console.error('Lỗi khi xóa thương hiệu:', error);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ success: false, message: 'Không thể xóa thương hiệu này vì có sản phẩm đang sử dụng nó. Vui lòng cập nhật hoặc xóa các sản phẩm liên quan trước.' });
            }
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    }
};

module.exports = brandController;