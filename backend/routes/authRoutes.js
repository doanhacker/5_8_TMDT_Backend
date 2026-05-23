const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Dang ky tai khoan nguoi dung moi
 *     tags: [Authentication]
 *     description: Tao tai khoan moi cho nguoi dung
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dang nhap
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mat khau (toi thieu 6 ky tu)
 *                 example: "password123"
 *               full_name:
 *                 type: string
 *                 description: Ho va ten day du
 *                 example: "Nguyen Van A"
 *               phone_number:
 *                 type: string
 *                 description: So dien thoai
 *                 example: "0901234567"
 *     responses:
 *       201:
 *         description: Dang ky thanh cong
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
 *                   example: Dang ky tai khoan thanh cong
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT token de authentication
 *       400:
 *         description: Thieu thong tin hoac du lieu khong hop le
 *       409:
 *         description: Email da duoc dang ky
 *       500:
 *         description: Loi may chu
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Dang nhap tai khoan
 *     tags: [Authentication]
 *     description: Dang nhap bang email va password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dang nhap
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mat khau
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Dang nhap thanh cong
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
 *                   example: Dang nhap thanh cong
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT token
 *       400:
 *         description: Thieu email hoac password
 *       401:
 *         description: Email hoac mat khau khong dung
 *       403:
 *         description: Tai khoan bi khoa
 *       500:
 *         description: Loi may chu
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/facebook:
 *   post:
 *     summary: Dang nhap bang Facebook access token
 *     tags: [Authentication]
 *     description: Nhan access token tu frontend, xac thuc voi Facebook Graph API va tra JWT cua he thong
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Access token nhan tu Facebook OAuth
 *                 example: "EAAB..."
 *     responses:
 *       200:
 *         description: Dang nhap Facebook thanh cong
 *       400:
 *         description: Thieu access token hoac khong lay duoc email tu Facebook
 *       401:
 *         description: Access token khong hop le
 *       403:
 *         description: Tai khoan bi khoa
 *       500:
 *         description: Loi may chu
 */
router.post('/facebook', authController.loginWithFacebook);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Gui ma xac thuc quen mat khau qua email
 *     tags: [Authentication]
 *     description: Gui ma 6 so ve email de xac thuc truoc khi doi mat khau
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email tai khoan can dat lai mat khau
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Luon tra ve thanh cong de tranh lo thong tin email ton tai hay khong
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
 *                   example: Neu email ton tai trong he thong, chung toi da gui ma xac thuc ve email cua ban.
 *       400:
 *         description: Email khong hop le
 *       500:
 *         description: Loi may chu
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: Xac thuc ma quen mat khau
 *     tags: [Authentication]
 *     description: Kiem tra ma reset 6 so con hieu luc truoc khi cho phep dat mat khau moi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               code:
 *                 type: string
 *                 description: Ma xac thuc 6 so nhan qua email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Ma xac thuc hop le
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
 *                   example: Ma xac thuc hop le
 *       400:
 *         description: Thieu du lieu, email khong hop le, hoac ma da het han/khong dung
 *       500:
 *         description: Loi may chu
 */
router.post('/verify-reset-code', authController.verifyResetCode);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Dat lai mat khau bang ma xac thuc
 *     tags: [Authentication]
 *     description: Doi mat khau moi sau khi da co ma reset hop le gui ve email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               code:
 *                 type: string
 *                 description: Ma xac thuc 6 so nhan qua email
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Mat khau moi (it nhat 6 ky tu)
 *                 example: "newpass123"
 *     responses:
 *       200:
 *         description: Dat lai mat khau thanh cong
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
 *                   example: Dat lai mat khau thanh cong. Ban co the dang nhap lai.
 *       400:
 *         description: Thieu du lieu, mat khau moi khong hop le, hoac ma da het han/khong dung
 *       404:
 *         description: Khong tim thay tai khoan
 *       500:
 *         description: Loi may chu
 */
router.post('/reset-password', authController.resetPassword);
router.post('/logout', verifyToken, authController.logout);
module.exports = router;
