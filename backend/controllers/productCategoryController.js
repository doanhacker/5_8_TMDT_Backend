const ProductCategory = require('../models/productCategoryModel');
const db = require('../config/db');
const { parseQueryParams, getOffset, buildPaginationResult } = require('../helpers/queryHelper');
const { isValidId } = require('../helpers/productValidationHelper');

const productCategoryController = {
    /**
     * API: Lấy tất cả danh mục (GET /api/categories)
     * Có thể có query param 'tree=true' để lấy dưới dạng cây.
     */
    getAllCategories: async (req, res) => {
        try {
            const { tree } = req.query;
            let categories;
            if (tree === 'true') {
                categories = await ProductCategory.getTree();
            } else {
                categories = await ProductCategory.getAll();
            }
            
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách danh mục sản phẩm thành công',
                data: categories
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách danh mục sản phẩm:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    // API: Lấy chi tiết danh mục theo ID (GET /api/categories/:id)
    getCategoryById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID danh mục sản phẩm không hợp lệ.' });
            }

            const category = await ProductCategory.getById(id);

            if (!category) {
                return res.status(404).json({ success: false, message: 'Danh mục sản phẩm không tồn tại!' });
            }

            res.status(200).json({
                success: true,
                message: 'Lấy chi tiết danh mục sản phẩm thành công',
                data: category
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết danh mục sản phẩm:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },


    /**
     * API: Thêm mới danh mục (POST /api/categories)
     * req.body: { category_name: string, parent_category_id?: number }
     */
    createCategory: async (req, res) => {
        try {
            const { category_name, parent_category_id } = req.body;

            // Validate dữ liệu đầu vào
            const errors = ProductCategory.validateProductCategoryData({ category_name, parent_category_id });
            if (errors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu danh mục sản phẩm', errors });
            }
            
            // Nếu có parent_category_id, kiểm tra xem nó có tồn tại không
            if (parent_category_id) {
                const parentCategory = await ProductCategory.getById(parent_category_id);
                if (!parentCategory) {
                    return res.status(404).json({ success: false, message: 'Danh mục cha không tồn tại.' });
                }
            }

            const newCategoryId = await ProductCategory.create({ 
                category_name, 
                parent_category_id: parent_category_id ? parseInt(parent_category_id) : null 
            });

            res.status(201).json({
                success: true,
                message: 'Thêm danh mục sản phẩm thành công!',
                data: { category_id: newCategoryId, category_name, parent_category_id }
            });
        } catch (error) {
            console.error('Lỗi khi thêm danh mục sản phẩm:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Cập nhật danh mục (PUT /api/categories/:id)
     * req.body: { category_name?: string, parent_category_id?: number|null }
     */
    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { category_name, parent_category_id } = req.body;

            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID danh mục sản phẩm không hợp lệ.' });
            }

            const existingCategory = await ProductCategory.getById(id);
            if (!existingCategory) {
                return res.status(404).json({ success: false, message: 'Danh mục sản phẩm không tồn tại để cập nhật!' });
            }

            // Validate dữ liệu đầu vào
            const errors = ProductCategory.validateProductCategoryData({ category_name, parent_category_id }, true); // isUpdate = true
            if (errors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu cập nhật danh mục sản phẩm', errors });
            }

            const updateData = {};
            if (category_name !== undefined) updateData.category_name = category_name;
            if (parent_category_id !== undefined) {
                // Kiểm tra parent_category_id mới
                if (parent_category_id !== null) {
                    const parentCategory = await ProductCategory.getById(parent_category_id);
                    if (!parentCategory) {
                        return res.status(404).json({ success: false, message: 'Danh mục cha không tồn tại.' });
                    }
                }
                updateData.parent_category_id = parent_category_id === null ? null : parseInt(parent_category_id);
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, message: 'Không có thông tin nào được cung cấp để cập nhật.' });
            }
            
            // Đảm bảo không đặt danh mục làm cha của chính nó
            if (updateData.parent_category_id === parseInt(id)) {
                return res.status(400).json({ success: false, message: 'Không thể đặt danh mục làm danh mục cha của chính nó.' });
            }

            const affectedRows = await ProductCategory.update(id, updateData);

            if (affectedRows === 0) {
                return res.status(200).json({ success: true, message: 'Không có thay đổi nào được thực hiện.' });
            }

            res.status(200).json({
                success: true,
                message: 'Cập nhật danh mục sản phẩm thành công!'
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật danh mục sản phẩm:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    // API: Xóa danh mục (DELETE /api/categories/:id)
    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID danh mục sản phẩm không hợp lệ.' });
            }

            const existingCategory = await ProductCategory.getById(id);
            if (!existingCategory) {
                return res.status(404).json({ success: false, message: 'Danh mục sản phẩm không tồn tại để xóa!' });
            }

            // Kiểm tra xem có sản phẩm nào đang sử dụng danh mục này không
            const [productsUsingCategory] = await db.query('SELECT product_id FROM products WHERE category_id = ? LIMIT 1', [id]);
            if (productsUsingCategory.length > 0) {
                return res.status(409).json({ success: false, message: 'Không thể xóa danh mục này vì có sản phẩm đang sử dụng nó.' });
            }

            // Kiểm tra xem có danh mục con nào đang tham chiếu đến danh mục này không
            const [childCategories] = await db.query('SELECT category_id FROM categories WHERE parent_category_id = ? LIMIT 1', [id]);
            if (childCategories.length > 0) {
                return res.status(409).json({ success: false, message: 'Không thể xóa danh mục này vì có danh mục con đang tham chiếu đến nó. Vui lòng cập nhật hoặc xóa các danh mục con trước.' });
            }


            const affectedRows = await ProductCategory.remove(id);

            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Không thể xóa danh mục sản phẩm.' });
            }

            res.status(200).json({
                success: true,
                message: 'Xóa danh mục sản phẩm thành công!'
            });
        } catch (error) {
            console.error('Lỗi khi xóa danh mục sản phẩm:', error);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ success: false, message: 'Không thể xóa danh mục này vì có sản phẩm đang sử dụng nó. Vui lòng cập nhật hoặc xóa các sản phẩm liên quan trước.' });
            }
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    }
};

module.exports = productCategoryController;