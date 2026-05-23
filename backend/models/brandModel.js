const db = require('../config/db');

// --- Helper Validation for Brand Data ---
const validateBrandData = (data, isUpdate = false) => {
    const { brand_name, logo_url } = data;
    const errors = [];

    if (!isUpdate) {
        if (!brand_name?.trim()) errors.push('Tên thương hiệu không được để trống.');
    }

    if (brand_name !== undefined && !brand_name.trim()) {
        errors.push('Tên thương hiệu không được để trống.');
    }
    // logo_url có thể null hoặc rỗng, không cần validate chặt chẽ về nội dung
    
    return errors;
};

const Brand = {
    /**
     * Lấy tất cả thương hiệu.
     * @returns {Promise<Array>} Danh sách thương hiệu.
     */
    getAll: async () => {
        const query = 'SELECT brand_id, brand_name, logo_url FROM brands ORDER BY brand_name ASC';
        const [rows] = await db.query(query);
        return rows;
    },

    /**
     * Lấy thông tin chi tiết một thương hiệu theo ID.
     * @param {number} id - ID của thương hiệu.
     * @returns {Promise<Object|null>} Đối tượng thương hiệu hoặc null nếu không tìm thấy.
     */
    getById: async (id) => {
        const query = 'SELECT brand_id, brand_name, logo_url FROM brands WHERE brand_id = ? LIMIT 1';
        const [rows] = await db.query(query, [id]);
        return rows[0] || null;
    },

    /**
     * Thêm mới một thương hiệu vào cơ sở dữ liệu.
     * @param {Object} brandData - Dữ liệu của thương hiệu (brand_name, logo_url).
     * @returns {Promise<number>} ID của thương hiệu vừa được thêm.
     */
    create: async (brandData) => {
        const { brand_name, logo_url } = brandData;
        const query = 'INSERT INTO brands (brand_name, logo_url) VALUES (?, ?)';
        const [result] = await db.query(query, [brand_name, logo_url || null]);
        return result.insertId;
    },

    /**
     * Cập nhật thông tin một thương hiệu.
     * @param {number} id - ID của thương hiệu cần cập nhật.
     * @param {Object} updateData - Dữ liệu thương hiệu cần cập nhật (brand_name, logo_url).
     * @returns {Promise<number>} Số dòng bị ảnh hưởng (0 hoặc 1).
     */
    update: async (id, updateData) => {
        const allowedFields = ['brand_name', 'logo_url'];
        const fieldsToUpdate = [];
        const values = [];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });

        if (fieldsToUpdate.length === 0) {
            return 0; // Không có trường nào để cập nhật
        }

        values.push(id);
        const query = `UPDATE brands SET ${fieldsToUpdate.join(', ')} WHERE brand_id = ?`;
        const [result] = await db.query(query, values);
        return result.affectedRows;
    },

    /**
     * Xóa một thương hiệu khỏi cơ sở dữ liệu.
     * FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE RESTRICT
     * Không thể xóa một thương hiệu nếu có sản phẩm đang sử dụng nó.
     * @param {number} id - ID của thương hiệu cần xóa.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng (0 hoặc 1).
     */
    remove: async (id) => {
        const query = 'DELETE FROM brands WHERE brand_id = ?';
        const [result] = await db.query(query, [id]);
        return result.affectedRows;
    },
    productsUsingBrand: async(id) => {
        const query = 'SELECT product_id FROM products WHERE brand_id = ? LIMIT 1';
        const [result] = await db.query(query, [id]);
        return result.length;
    }
};

module.exports = {
    ...Brand, // Export tất cả các hàm của Brand
    validateBrandData // Export thêm hàm validation
};