const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const uploadProduct = require('../middlewares/uploadProductImageMiddleware'); // Import middleware upload ảnh sản phẩm
const { verifyToken, verifyTokenOptional, verifyAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductVariantInput:
 *       type: object
 *       required: [sku, ram_gb, storage_gb, color_name, original_price]
 *       properties:
 *         sku:
 *           type: string
 *           example: LAPTOP-ASUS-16-512-BLACK
 *         cpu_name:
 *           type: string
 *           example: Intel Core i7-13620H
 *         cpu_benchmark_score:
 *           type: integer
 *           example: 25100
 *         gpu:
 *           type: string
 *           example: RTX 4060
 *         ram_gb:
 *           type: integer
 *           example: 16
 *         storage_gb:
 *           type: integer
 *           example: 512
 *         color_name:
 *           type: string
 *           example: Black
 *         original_price:
 *           type: number
 *           format: float
 *           example: 25990000
 *         discount_price:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 23990000
 *         stock_quantity:
 *           type: integer
 *           example: 15
 *         status:
 *           type: string
 *           enum: [IN_STOCK, OUT_OF_STOCK, DISCONTINUED]
 *           example: IN_STOCK
 */

// Cấu hình Multer để chấp nhận nhiều trường file.
// Đây là một cấu hình mẫu, có thể điều chỉnh số lượng và tên trường tùy theo giao diện frontend.
// Frontend sẽ gửi các file ảnh với các trường tên này.
const productImagesUploadFields = uploadProduct.fields([
    { name: 'productImages', maxCount: 5 }, // Ảnh chính cấp sản phẩm (tối đa 5 ảnh)
    { name: 'variant_0_images', maxCount: 5 }, // Ảnh cho variant đầu tiên
    { name: 'variant_1_images', maxCount: 5 }, // Ảnh cho variant thứ hai
    { name: 'variant_2_images', maxCount: 5 },
    { name: 'variant_3_images', maxCount: 5 },
    { name: 'variant_4_images', maxCount: 5 },
    { name: 'variant_5_images', maxCount: 5 },
    // Thêm các trường tương tự cho update nếu bạn muốn phân biệt file mới giữa create và update
    { name: 'newProductImages', maxCount: 5 },
    { name: 'newVariant_0_images_update', maxCount: 5 },
    { name: 'newVariant_1_images_update', maxCount: 5 },
    { name: 'newVariant_2_images_update', maxCount: 5 },
    { name: 'newVariant_3_images_update', maxCount: 5 },
    { name: 'newVariant_4_images_update', maxCount: 5 },
    { name: 'newVariant_5_images_update', maxCount: 5 },
    { name: 'newVariant_0_images_create', maxCount: 5 }, // Cho variants được tạo mới trong update
    { name: 'newVariant_1_images_create', maxCount: 5 },
    { name: 'newVariant_2_images_create', maxCount: 5 }
]);

const handleProductUpload = (req, res, next) => {
    productImagesUploadFields(req, res, (err) => {
        if (!err) {
            return next();
        }

        console.error('Upload product images error:', err);
        const rawError =
            err?.message ||
            err?.error?.message ||
            err?.toString?.() ||
            'Upload failed';
        const helpText = 'Kiem tra lai lenh curl (dung curl.exe), khong set Content-Type thu cong, va chi gui field anh dung dinh dang @file.';

        return res.status(400).json({
            success: false,
            message: 'Loi upload anh san pham',
            error_code: err.code || null,
            error: rawError,
            hint: helpText
        });
    });
};

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Products]
 *     description: Hỗ trợ tìm kiếm, lọc, sắp xếp và phân trang.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         example: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: asus
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: integer
 *         example: 3
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *         example: 15000000
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *         example: 40000000
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IN_STOCK, OUT_OF_STOCK, DISCONTINUED]
 *         example: IN_STOCK
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         example: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         example: desc
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm thành công
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// GET tất cả sản phẩm (có thể kèm theo lọc, tìm kiếm, sắp xếp, phân trang)
router.get('/', verifyTokenOptional, productController.getAllProducts);

router.get('/search/suggest', productController.getSearchSuggestions);

/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm theo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Lấy chi tiết sản phẩm thành công
 *       400:
 *         description: ID sản phẩm không hợp lệ
 *       404:
 *         description: Sản phẩm không tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// GET chi tiết sản phẩm theo ID
router.get('/:productId', productController.getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo mới sản phẩm
 *     tags: [Products]
 *     description: |
 *       API dùng `multipart/form-data`.
 *       - Trường `variants` phải là chuỗi JSON array theo schema `ProductVariantInput`.
 *       - Upload ảnh cấp sản phẩm bằng field `productImages`.
 *       - Upload ảnh theo từng variant bằng các field `variant_0_images`, `variant_1_images`, ...
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - product_name
 *               - brand_id
 *               - category_id
 *               - variants
 *             properties:
 *               product_name:
 *                 type: string
 *                 example: ASUS ROG Strix G16
 *               brand_id:
 *                 type: integer
 *                 example: 1
 *               category_id:
 *                 type: integer
 *                 example: 2
 *               description_html:
 *                 type: string
 *                 example: <p>Laptop gaming hiệu năng cao</p>
 *               highlight_features:
 *                 type: string
 *                 example: Màn hình 165Hz, bàn phím RGB
 *               screen_size:
 *                 type: number
 *                 format: float
 *                 example: 16
 *               weight_kg:
 *                 type: number
 *                 format: float
 *                 example: 2.3
 *               os:
 *                 type: string
 *                 example: Windows 11
 *               variants:
 *                 type: string
 *                 description: JSON string của mảng variant.
 *                 example: '[{"sku":"ROG-G16-16-512","ram_gb":16,"storage_gb":512,"color_name":"Black","original_price":25990000,"stock_quantity":10}]'
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               variant_0_images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               variant_1_images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       404:
 *         description: Brand hoặc category không tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// POST tạo mới sản phẩm 
router.post('/', verifyToken, verifyAdmin, handleProductUpload, productController.createProduct);

/**
 * @swagger
 * /api/products/{productId}:
 *   put:
 *     summary: Cập nhật sản phẩm
 *     tags: [Products]
 *     description: |
 *       API dùng `multipart/form-data`.
 *       - `variants_to_update` là JSON string, mỗi phần tử gồm `variant_id`, `data`, tùy chọn `delete_image_ids`, `primary_image_id`.
 *       - `variants_to_create` là JSON string mảng variant mới.
 *       - Ảnh mới cấp sản phẩm: `newProductImages`.
 *       - Ảnh mới cho variant update: `newVariant_0_images_update`, `newVariant_1_images_update`, ...
 *       - Ảnh cho variant tạo mới: `newVariant_0_images_create`, `newVariant_1_images_create`, ...
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product_name:
 *                 type: string
 *               brand_id:
 *                 type: integer
 *               category_id:
 *                 type: integer
 *               description_html:
 *                 type: string
 *               highlight_features:
 *                 type: string
 *               screen_size:
 *                 type: number
 *                 format: float
 *               weight_kg:
 *                 type: number
 *                 format: float
 *               os:
 *                 type: string
 *               delete_image_ids:
 *                 type: string
 *                 description: JSON string mảng ID ảnh sản phẩm cần xóa
 *                 example: '[11,12]'
 *               primary_product_image_id:
 *                 type: integer
 *                 example: 10
 *               variants_to_update:
 *                 type: string
 *                 description: JSON string mảng variant cần cập nhật
 *                 example: '[{"variant_id":5,"data":{"stock_quantity":7},"delete_image_ids":[21],"primary_image_id":22}]'
 *               variants_to_create:
 *                 type: string
 *                 description: JSON string mảng variant tạo mới
 *                 example: '[{"sku":"ROG-G16-32-1TB","ram_gb":32,"storage_gb":1024,"color_name":"Gray","original_price":29990000}]'
 *               newProductImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               newVariant_0_images_update:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               newVariant_0_images_create:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không có thay đổi
 *       404:
 *         description: Sản phẩm/brand/category không tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// PUT cập nhật sản phẩm theo ID
router.put('/:productId', verifyToken, verifyAdmin, handleProductUpload, productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Ngừng kinh doanh sản phẩm
 *     tags: [Products]
 *     description: Không xóa cứng sản phẩm, cập nhật trạng thái tất cả variant sang `DISCONTINUED`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái variant thành công
 *       400:
 *         description: ID không hợp lệ hoặc không thể cập nhật
 *       404:
 *         description: Sản phẩm không tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// DELETE sản phẩm theo ID (soft delete - cập nhật trạng thái variants)
router.delete('/:id', verifyToken, verifyAdmin, productController.deleteProduct);

module.exports = router;