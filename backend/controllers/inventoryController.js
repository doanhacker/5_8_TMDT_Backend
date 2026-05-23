const Inventory = require('../models/inventoryModel');
const db = require('../config/db');
const { parseQueryParams, getOffset, buildPaginationResult } = require('../helpers/queryHelper');
const { isValidId } = require('../helpers/productValidationHelper');

const inventoryController = {
    /**
     * API: Tạo phiếu nhập mới (POST /api/inventory/receipts)
     * req.body: {
     *   importer_id?: number,
     *   supplier_name: string,
     *   details: Array<{ variant_id: number, import_quantity: number, unit_import_price: number }>
     * }
     */
    createImportReceipt: async (req, res) => {
        try {
            const { importer_id, supplier_name, details } = req.body;

            // 1. Validate dữ liệu phiếu nhập chính
            if (!supplier_name?.trim()) {
                return res.status(400).json({ success: false, message: 'Tên nhà cung cấp không được để trống.' });
            }
            if (importer_id !== undefined && !isValidId(importer_id)) {
                return res.status(400).json({ success: false, message: 'ID người nhập không hợp lệ.' });
            }

            // 2. Validate chi tiết phiếu nhập
            if (!details || !Array.isArray(details) || details.length === 0) {
                return res.status(400).json({ success: false, message: 'Chi tiết phiếu nhập không hợp lệ hoặc trống.' });
            }

            let total_import_cost = 0;
            for (const [index, detail] of details.entries()) {
                const detailErrors = Inventory.validateImportDetail(detail); // Sử dụng helper
                if (detailErrors.length > 0) {
                    return res.status(400).json({ success: false, message: `Lỗi chi tiết phiếu nhập #${index + 1}`, errors: detailErrors });
                }
                
                // Kiểm tra xem variant_id có tồn tại không
                const [existingVariant] = await db.query('SELECT variant_id FROM product_variants WHERE variant_id = ?', [detail.variant_id]);
                if (existingVariant.length === 0) {
                    return res.status(404).json({ success: false, message: `Phiên bản sản phẩm với ID ${detail.variant_id} không tồn tại.` });
                }

                total_import_cost += detail.import_quantity * detail.unit_import_price;
            }

            const receiptData = {
                importer_id: importer_id ? parseInt(importer_id) : null,
                supplier_name,
                total_import_cost
            };

            const newReceiptId = await Inventory.createImportReceipt(receiptData, details);

            res.status(201).json({
                success: true,
                message: 'Tạo phiếu nhập và cập nhật tồn kho thành công!',
                data: { receipt_id: newReceiptId }
            });

        } catch (error) {
            console.error('Lỗi khi tạo phiếu nhập:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Lấy danh sách phiếu nhập (GET /api/inventory/receipts)
     * Hỗ trợ phân trang, tìm kiếm theo nhà cung cấp.
     */
    getAllImportReceipts: async (req, res) => {
        try {
            const queryParams = parseQueryParams(req.query, {
                defaultSortBy: 'import_date',
                defaultLimit: 10
            });
            const { page, limit, search, sortBy, sortOrder } = queryParams;

            const options = {
                page,
                limit,
                searchSupplier: search, // map search param to searchSupplier in model
                sortBy,
                sortOrder
            };

            const receipts = await Inventory.getAllImportReceipts(options);
            const totalCount = await Inventory.getTotalImportReceiptsCount(options);

            res.status(200).json(buildPaginationResult(receipts, totalCount, page, limit));
        } catch (error) {
            console.error('Lỗi khi lấy danh sách phiếu nhập:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Lấy chi tiết phiếu nhập theo ID (GET /api/inventory/receipts/:id)
     */
    getImportReceiptById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidId(id)) {
                return res.status(400).json({ success: false, message: 'ID phiếu nhập không hợp lệ.' });
            }

            const receipt = await Inventory.getImportReceiptById(id);

            if (!receipt) {
                return res.status(404).json({ success: false, message: 'Phiếu nhập không tồn tại!' });
            }

            res.status(200).json({
                success: true,
                message: 'Lấy chi tiết phiếu nhập thành công',
                data: receipt
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết phiếu nhập:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Lấy danh sách phiên bản sản phẩm tồn kho thấp (GET /api/inventory/low-stock)
     * req.query: { threshold?: number }
     */
    getLowStockProducts: async (req, res) => {
        try {
            const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;

            if (isNaN(threshold) || threshold < 0) {
                return res.status(400).json({ success: false, message: 'Ngưỡng tồn kho không hợp lệ, phải là số nguyên không âm.' });
            }

            const lowStockProducts = await Inventory.getLowStockProducts(threshold);

            res.status(200).json({
                success: true,
                message: `Lấy danh sách phiên bản sản phẩm tồn kho dưới ${threshold} thành công.`,
                data: lowStockProducts
            });
        } catch (error) {
            console.error('Lỗi khi lấy sản phẩm tồn kho thấp:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    }
};

module.exports = inventoryController;