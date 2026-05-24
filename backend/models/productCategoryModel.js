const db = require('../config/db');

const VALID_DEVICE_TYPES = ['LAPTOP', 'PHONE', 'TABLET', 'WATCH', 'AUDIO', 'ACCESSORY', 'OTHER'];

const normalizeDeviceType = (deviceType) => String(deviceType || '').trim().toUpperCase();

const validateProductCategoryData = (data, isUpdate = false) => {
    const { category_name, parent_category_id, device_type } = data;
    const errors = [];

    if (!isUpdate) {
        if (!category_name?.trim()) errors.push('Tên danh mục sản phẩm không được để trống.');
    }

    if (category_name !== undefined && !category_name.trim()) {
        errors.push('Tên danh mục sản phẩm không được để trống.');
    }
    if (!isUpdate && !String(device_type || '').trim()) {
        errors.push('Loại thiết bị không được để trống.');
    }
    if (device_type !== undefined) {
        const normalizedType = normalizeDeviceType(device_type);
        if (!VALID_DEVICE_TYPES.includes(normalizedType)) {
            errors.push(`Loại thiết bị không hợp lệ. Chỉ chấp nhận: ${VALID_DEVICE_TYPES.join(', ')}.`);
        }
    }
    if (parent_category_id !== undefined && parent_category_id !== null && (isNaN(parseInt(parent_category_id)) || parseInt(parent_category_id) <= 0)) {
        errors.push('ID danh mục cha không hợp lệ.');
    }
    
    return errors;
};

const ProductCategory = {
    /**
     * Lấy tất cả danh mục.
     * Có thể trả về dưới dạng phẳng hoặc có cấu trúc cây (tree structure).
     * @returns {Promise<Array>} Danh sách danh mục.
     */
    getAll: async (options = {}) => {
        let query = 'SELECT category_id, category_name, parent_category_id, device_type FROM categories';
        const values = [];

        if (options.deviceType) {
            query += ' WHERE UPPER(TRIM(device_type)) = ?';
            values.push(normalizeDeviceType(options.deviceType));
        }

        query += ' ORDER BY category_name ASC';

        const [rows] = await db.query(query, values);
        return rows;
    },

    /**
     * Lấy danh mục dưới dạng cây phân cấp.
     * @returns {Promise<Array>} Danh sách danh mục dưới dạng cây.
     */
    getTree: async (options = {}) => {
        let query = 'SELECT category_id, category_name, parent_category_id, device_type FROM categories';
        const values = [];

        if (options.deviceType) {
            query += ' WHERE UPPER(TRIM(device_type)) = ?';
            values.push(normalizeDeviceType(options.deviceType));
        }

        const [rows] = await db.query(query, values);

        const categoriesMap = {};
        rows.forEach(cat => {
            categoriesMap[cat.category_id] = { ...cat, children: [] };
        });

        const tree = [];
        rows.forEach(cat => {
            if (cat.parent_category_id === null) {
                tree.push(categoriesMap[cat.category_id]);
            } else {
                if (categoriesMap[cat.parent_category_id]) {
                    categoriesMap[cat.parent_category_id].children.push(categoriesMap[cat.category_id]);
                }
            }
        });
        return tree;
    },

    /**
     * Lấy thông tin chi tiết một danh mục theo ID.
     * @param {number} id - ID của danh mục.
     * @returns {Promise<Object|null>} Đối tượng danh mục hoặc null nếu không tìm thấy.
     */
    getById: async (id) => {
        const query = 'SELECT category_id, category_name, parent_category_id, device_type FROM categories WHERE category_id = ? LIMIT 1';
        const [rows] = await db.query(query, [id]);
        return rows[0] || null;
    },

    /**
     * Thêm mới một danh mục vào cơ sở dữ liệu.
     * @param {Object} categoryData - Dữ liệu của danh mục (category_name, parent_category_id).
     * @returns {Promise<number>} ID của danh mục vừa được thêm.
     */
    create: async (categoryData) => {
        const { category_name, parent_category_id, device_type } = categoryData;
        const query = 'INSERT INTO categories (category_name, parent_category_id, device_type) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [
            category_name,
            parent_category_id || null,
            normalizeDeviceType(device_type || 'LAPTOP'),
        ]);
        return result.insertId;
    },

    /**
     * Cập nhật thông tin một danh mục.
     * @param {number} id - ID của danh mục cần cập nhật.
     * @param {Object} updateData - Dữ liệu danh mục cần cập nhật (category_name, parent_category_id).
     * @returns {Promise<number>} Số dòng bị ảnh hưởng (0 hoặc 1).
     */
    update: async (id, updateData) => {
        const allowedFields = ['category_name', 'parent_category_id', 'device_type'];
        const fieldsToUpdate = [];
        const values = [];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(field === 'device_type' ? normalizeDeviceType(updateData[field]) : updateData[field]);
            }
        });

        if (fieldsToUpdate.length === 0) {
            return 0; // Không có trường nào để cập nhật
        }

        // Đảm bảo không đặt parent_category_id là chính nó
        if (updateData.parent_category_id === id) {
            throw new Error('Không thể đặt danh mục làm danh mục cha của chính nó.');
        }

        values.push(id);
        const query = `UPDATE categories SET ${fieldsToUpdate.join(', ')} WHERE category_id = ?`;
        const [result] = await db.query(query, values);
        return result.affectedRows;
    },

    /**
     * Xóa một danh mục khỏi cơ sở dữ liệu.
     * FOREIGN KEY (parent_category_id) REFERENCES categories(category_id) ON DELETE SET NULL
     * Khi danh mục cha bị xóa, parent_category_id của các danh mục con sẽ được đặt thành NULL.
     * FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
     * Không thể xóa một danh mục nếu có sản phẩm đang sử dụng nó.
     * @param {number} id - ID của danh mục cần xóa.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng (0 hoặc 1).
     */
    remove: async (id) => {
        const query = 'DELETE FROM categories WHERE category_id = ?';
        const [result] = await db.query(query, [id]);
        return result.affectedRows;
    },
    productsUsingCategory: async(id) => {
        const query = 'SELECT product_id FROM products WHERE category_id = ? LIMIT 1';
        const [result] = await db.query(query, [id]);
        return result.length;
    },
    childCategories: async(id) => {
        const query = 'SELECT category_id FROM categories WHERE parent_category_id = ? LIMIT 1';
        const [result] = await db.query(query, [id]);
        return result.length;
    }
};

module.exports = {
    ...ProductCategory,
    validateProductCategoryData,
    normalizeDeviceType,
    VALID_DEVICE_TYPES,
};