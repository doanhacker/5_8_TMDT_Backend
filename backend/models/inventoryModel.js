const db = require('../config/db');
const { isValidId, VALID_STATUSES } = require('../helpers/productValidationHelper');

const validateImportDetail = (detail) => {
    const errors = [];
    if (!isValidId(detail.variant_id)) {
        errors.push('ID phiên bản sản phẩm không hợp lệ.');
    }
    if (isNaN(parseInt(detail.import_quantity)) || parseInt(detail.import_quantity) <= 0) {
        errors.push('Số lượng nhập phải là số nguyên dương.');
    }
    if (isNaN(parseFloat(detail.unit_import_price)) || parseFloat(detail.unit_import_price) <= 0) {
        errors.push('Giá nhập đơn vị phải là số dương.');
    }
    return errors;
};

const Inventory = {
    /**
     * Tạo một phiếu nhập mới, bao gồm các chi tiết phiên bản sản phẩm và cập nhật số lượng tồn kho.
     * Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu.
     * @param {Object} receiptData - Dữ liệu của phiếu nhập (importer_id, supplier_name, total_import_cost).
     * @param {Array<Object>} detailsData - Mảng các đối tượng chi tiết phiếu nhập ({ variant_id, import_quantity, unit_import_price }).
     * @returns {Promise<number>} ID của phiếu nhập vừa được tạo.
     */
    createImportReceipt: async (receiptData, detailsData) => {
        const connection = await db.getConnection(); // Lấy một kết nối từ pool để sử dụng transaction
        try {
            await connection.beginTransaction(); // Bắt đầu transaction

            // 1. Thêm phiếu nhập chính
            const receiptInsertQuery = `
                INSERT INTO import_receipts 
                (importer_id, supplier_name, total_import_cost) 
                VALUES (?, ?, ?)
            `;
            const receiptValues = [
                receiptData.importer_id || null, // importer_id có thể null nếu chưa có hệ thống user
                receiptData.supplier_name,
                receiptData.total_import_cost
            ];
            const [receiptResult] = await connection.query(receiptInsertQuery, receiptValues);
            const newReceiptId = receiptResult.insertId;

            // 2. Thêm chi tiết phiếu nhập và cập nhật tồn kho cho từng sản phẩm
            const detailInsertQuery = `
                INSERT INTO import_receipt_details
                (receipt_id, variant_id, import_quantity, unit_import_price)
                VALUES (?, ?, ?, ?)
            `;
            const updateStockQuery = `
                UPDATE product_variants -- Cập nhật bảng product_variants
                SET stock_quantity = stock_quantity + ?
                WHERE variant_id = ?
            `;

            for (const detail of detailsData) {
                // Thêm chi tiết phiếu nhập
                await connection.query(detailInsertQuery, [
                    newReceiptId,
                    detail.variant_id,
                    detail.import_quantity,
                    detail.unit_import_price
                ]);

                // Cập nhật số lượng tồn kho phiên bản sản phẩm
                await connection.query(updateStockQuery, [
                    detail.import_quantity,
                    detail.variant_id
                ]);
            }

            await connection.commit(); // Cam kết transaction
            return newReceiptId;

        } catch (error) {
            await connection.rollback(); // Hoàn tác transaction nếu có lỗi
            throw error;
        } finally {
            connection.release(); // Trả kết nối về pool
        }
    },

    /**
     * Lấy tất cả các phiếu nhập.
     * Có thể bao gồm thông tin người nhập (nếu importer_id không null).
     * @param {Object} options - Tùy chọn lọc và phân trang (ví dụ: page, limit, searchSupplier).
     * @returns {Promise<Array>} Danh sách phiếu nhập.
     */
    getAllImportReceipts: async (options = {}) => {
        const { page = 1, limit = 10, searchSupplier, sortBy = 'import_date', sortOrder = 'DESC' } = options;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                ir.receipt_id, 
                ir.importer_id, 
                u.full_name AS importer_name, 
                ir.supplier_name, 
                ir.total_import_cost, 
                ir.import_date
            FROM import_receipts ir
            LEFT JOIN users u ON ir.importer_id = u.user_id
            WHERE 1=1
        `;
        const values = [];

        if (searchSupplier) {
            query += ` AND ir.supplier_name LIKE ?`;
            values.push(`%${searchSupplier}%`);
        }

        const validSortBy = ['receipt_id', 'importer_name', 'supplier_name', 'total_import_cost', 'import_date'];
        const finalSortBy = validSortBy.includes(sortBy) ? sortBy : 'import_date';
        const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;
        query += ` LIMIT ? OFFSET ?`;
        values.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(query, values);
        return rows;
    },

    /**
     * Đếm tổng số phiếu nhập cho phân trang.
     * @param {Object} options - Tùy chọn lọc (ví dụ: searchSupplier).
     * @returns {Promise<number>} Tổng số phiếu nhập.
     */
    getTotalImportReceiptsCount: async (options = {}) => {
        const { searchSupplier } = options;
        let query = `SELECT COUNT(receipt_id) AS total_count FROM import_receipts WHERE 1=1`;
        const values = [];

        if (searchSupplier) {
            query += ` AND supplier_name LIKE ?`;
            values.push(`%${searchSupplier}%`);
        }
        const [rows] = await db.query(query, values);
        return rows[0].total_count;
    },


    /**
     * Lấy chi tiết một phiếu nhập theo ID, bao gồm thông tin sản phẩm.
     * @param {number} receiptId - ID của phiếu nhập.
     * @returns {Promise<Object|null>} Đối tượng phiếu nhập cùng chi tiết, hoặc null nếu không tìm thấy.
     */
    getImportReceiptById: async (receiptId) => {
        // 1. Lấy thông tin phiếu nhập chính
        const receiptQuery = `
            SELECT 
                ir.receipt_id, 
                ir.importer_id, 
                u.full_name AS importer_name, 
                ir.supplier_name, 
                ir.total_import_cost, 
                ir.import_date
            FROM import_receipts ir
            LEFT JOIN users u ON ir.importer_id = u.user_id
            WHERE ir.receipt_id = ?
        `;
        const [receiptRows] = await db.query(receiptQuery, [receiptId]);

        if (receiptRows.length === 0) {
            return null;
        }

        const receipt = receiptRows[0];

        // 2. Lấy chi tiết các sản phẩm trong phiếu nhập
        const detailsQuery = `
            SELECT
                ird.id AS detail_id,
                ird.variant_id, -- Đã đổi từ product_id
                pv.sku,         -- Lấy SKU của variant
                p.product_name, -- Lấy tên sản phẩm chính
                pv.color_name,  -- Lấy màu sắc của variant
                pv.ram_gb,      -- Lấy RAM của variant
                pv.storage_gb,  -- Lấy bộ nhớ của variant
                COALESCE(
                    (SELECT image_url FROM product_images WHERE variant_id = pv.variant_id AND is_primary = TRUE LIMIT 1),
                    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND variant_id IS NULL AND is_primary = TRUE LIMIT 1),
                    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND variant_id IS NULL ORDER BY image_id ASC LIMIT 1),
                    (SELECT image_url FROM product_images WHERE variant_id = pv.variant_id ORDER BY image_id ASC LIMIT 1)
                ) AS primary_variant_image_url,
                ird.import_quantity,
                ird.unit_import_price
            FROM import_receipt_details ird
            JOIN product_variants pv ON ird.variant_id = pv.variant_id -- JOIN với product_variants
            JOIN products p ON pv.product_id = p.product_id             -- JOIN với products để lấy tên sản phẩm chính
            WHERE ird.receipt_id = ?
        `;
        const [detailsRows] = await db.query(detailsQuery, [receiptId]);
        receipt.details = detailsRows;

        return receipt;
    },

    /**
     * Lấy danh sách các phiên bản sản phẩm có số lượng tồn kho dưới mức cảnh báo.
     * @param {number} threshold - Ngưỡng số lượng tồn kho tối thiểu.
     * @returns {Promise<Array>} Danh sách phiên bản sản phẩm cảnh báo tồn kho thấp.
     */
    getLowStockProducts: async (threshold) => {
        // Validation của threshold đã được thực hiện ở controller
        const query = `
            SELECT
                pv.variant_id,
                pv.sku,
                p.product_id,
                p.product_name,
                pv.color_name,
                pv.ram_gb,
                pv.storage_gb,
                pv.stock_quantity,
                b.brand_name,
                c.category_name,
                COALESCE(
                    (SELECT image_url FROM product_images WHERE variant_id = pv.variant_id AND is_primary = TRUE LIMIT 1),
                    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND variant_id IS NULL AND is_primary = TRUE LIMIT 1),
                    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND variant_id IS NULL ORDER BY image_id ASC LIMIT 1),
                    (SELECT image_url FROM product_images WHERE variant_id = pv.variant_id ORDER BY image_id ASC LIMIT 1)
                ) AS primary_variant_image_url
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE pv.stock_quantity <= ? AND pv.status = ? -- Chỉ lấy các variant đang IN_STOCK hoặc COMING_SOON
            ORDER BY pv.stock_quantity ASC
        `;
        // Chỉ xét các variant đang IN_STOCK hoặc COMING_SOON cho cảnh báo tồn kho thấp
        const [rows] = await db.query(query, [threshold, 'IN_STOCK']);
        return rows;
    }
};

module.exports = {
    ...Inventory,
    validateImportDetail
};
