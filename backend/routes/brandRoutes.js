const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Lấy danh sách tất cả thương hiệu
 *     tags: [Brands]
 *     description: Trả về danh sách tất cả thương hiệu laptop.
 *     responses:
 *       200:
 *         description: Lấy danh sách thương hiệu thành công
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
 *                   example: Lấy danh sách thương hiệu thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Brand'
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// GET tất cả thương hiệu
router.get('/', brandController.getAllBrands);

/**
 * @swagger
 * /api/brands/{id}:
 *   get:
 *     summary: Lấy chi tiết thương hiệu theo ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thương hiệu
 *     responses:
 *       200:
 *         description: Lấy chi tiết thương hiệu thành công
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
 *                   example: Lấy chi tiết thương hiệu thành công
 *                 data:
 *                   $ref: '#/components/schemas/Brand'
 *       400:
 *         description: ID thương hiệu không hợp lệ
 *       404:
 *         description: Thương hiệu không tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// GET chi tiết thương hiệu theo ID
router.get('/:id', brandController.getBrandById);

/**
 * @swagger
 * /api/brands:
 *   post:
 *     summary: Tạo thương hiệu mới
 *     tags: [Brands]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brand_name
 *             properties:
 *               brand_name:
 *                 type: string
 *                 example: ASUS
 *               logo_url:
 *                 type: string
 *                 nullable: true
 *                 example: https://example.com/asus-logo.png
 *     responses:
 *       201:
 *         description: Tạo thương hiệu thành công
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
 *                   example: Thêm thương hiệu thành công!
 *                 data:
 *                   $ref: '#/components/schemas/Brand'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Tên thương hiệu đã tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// POST tạo mới thương hiệu
router.post('/', verifyToken, verifyAdmin, brandController.createBrand);

/**
 * @swagger
 * /api/brands/{id}:
 *   put:
 *     summary: Cập nhật thương hiệu
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thương hiệu cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand_name:
 *                 type: string
 *                 example: ASUS ROG
 *               logo_url:
 *                 type: string
 *                 nullable: true
 *                 example: https://example.com/asus-rog-logo.png
 *     responses:
 *       200:
 *         description: Cập nhật thương hiệu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không có thay đổi
 *       404:
 *         description: Thương hiệu không tồn tại
 *       409:
 *         description: Tên thương hiệu đã tồn tại
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// PUT cập nhật thương hiệu theo ID
router.put('/:id', verifyToken, verifyAdmin, brandController.updateBrand);

/**
 * @swagger
 * /api/brands/{id}:
 *   delete:
 *     summary: Xóa thương hiệu
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thương hiệu cần xóa
 *     responses:
 *       200:
 *         description: Xóa thương hiệu thành công
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Thương hiệu không tồn tại
 *       409:
 *         description: Thương hiệu đang được sản phẩm sử dụng, không thể xóa
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
// DELETE thương hiệu theo ID
router.delete('/:id', verifyToken, verifyAdmin, brandController.deleteBrand);

module.exports = router;