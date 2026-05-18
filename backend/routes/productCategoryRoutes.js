const express = require('express');
const router = express.Router();
const productCategoryController = require('../controllers/productCategoryController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/product-categories:
 *   get:
 *     summary: Lấy danh sách danh mục sản phẩm
 *     tags: [Product Categories]
 *     description: Trả về danh sách danh mục dạng phẳng hoặc dạng cây khi truyền `tree=true`.
 *     parameters:
 *       - in: query
 *         name: tree
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Truyền `true` để lấy danh mục dạng cây.
 *         example: "true"
 *     responses:
 *       200:
 *         description: Lấy danh sách danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách danh mục sản phẩm thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductCategory'
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// GET tất cả danh mục (có thể kèm query param 'tree=true')
router.get('/', productCategoryController.getAllCategories);

/**
 * @swagger
 * /api/product-categories/{id}:
 *   get:
 *     summary: Lấy chi tiết danh mục theo ID
 *     tags: [Product Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID danh mục sản phẩm
 *     responses:
 *       200:
 *         description: Lấy chi tiết danh mục thành công
 *       400:
 *         description: ID danh mục không hợp lệ
 *       404:
 *         description: Danh mục không tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// GET chi tiết danh mục theo ID
router.get('/:id', productCategoryController.getCategoryById);

/**
 * @swagger
 * /api/product-categories:
 *   post:
 *     summary: Tạo danh mục sản phẩm mới
 *     tags: [Product Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_name
 *             properties:
 *               category_name:
 *                 type: string
 *                 example: Laptop Gaming
 *               parent_category_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Danh mục cha không tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// POST tạo mới danh mục
router.post('/', verifyToken, verifyAdmin, productCategoryController.createCategory);

/**
 * @swagger
 * /api/product-categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục sản phẩm
 *     tags: [Product Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID danh mục cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_name:
 *                 type: string
 *                 example: Laptop Gaming Cao Cap
 *               parent_category_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *     responses:
 *       200:
 *         description: Cập nhật danh mục thành công
 *       400:
 *         description: Dữ liệu cập nhật không hợp lệ
 *       404:
 *         description: Danh mục hoặc danh mục cha không tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// PUT cập nhật danh mục theo ID
router.put('/:id', verifyToken, verifyAdmin, productCategoryController.updateCategory);

/**
 * @swagger
 * /api/product-categories/{id}:
 *   delete:
 *     summary: Xóa danh mục sản phẩm
 *     tags: [Product Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID danh mục cần xóa
 *     responses:
 *       200:
 *         description: Xóa danh mục thành công
 *       400:
 *         description: ID không hợp lệ hoặc không thể xóa
 *       404:
 *         description: Danh mục không tồn tại
 *       409:
 *         description: Danh mục đang được tham chiếu bởi sản phẩm hoặc danh mục con
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// DELETE danh mục theo ID
router.delete('/:id', verifyToken, verifyAdmin, productCategoryController.deleteCategory);

module.exports = router;