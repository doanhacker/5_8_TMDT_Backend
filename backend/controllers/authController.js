const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const PasswordReset = require('../models/passwordResetModel');
const { sendEmail } = require('../utils/mailer');
require('dotenv').config();
const db = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createAuthToken = (userId, email, tokenVersion = 1) => jwt.sign(
    { user_id: userId, email, token_version: tokenVersion },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
);

const fetchFacebookProfile = async (accessToken) => {
    if (typeof fetch !== 'function') {
        throw new Error('Node.js hiện tại không hỗ trợ fetch toàn cục');
    }

    const url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok || payload.error) {
        const fbError = payload?.error?.message || 'Access token Facebook không hợp lệ';
        throw new Error(fbError);
    }

    return payload;
};

// Tạo mã xác thực 6 số ngẫu nhiên
const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendResetCodeEmail = async ({ to, fullName, resetCode }) => {
    const subject = 'Mã xác thực đặt lại mật khẩu - Laptop Shop';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
            <h2>Xin chào ${fullName || 'bạn'},</h2>
            <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Mã xác thực của bạn là:</p>
            <h1 style="background: #f3f4f6; padding: 15px 20px; border-radius: 8px; text-align: center; letter-spacing: 8px; color: #e30019;">
                ${resetCode}
            </h1>
            <p>Mã này có hiệu lực trong <strong>15 phút</strong>.</p>
            <p>Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.</p>
        </div>
    `;
    await sendEmail(to, subject, html);
};

const getUserWithRoles = async (user) => {
    const roles = await User.getUserRoles(user.user_id);
    delete user.password_hash;
    return {
        ...user,
        roles
    };
};

const authController = {
    // API Đăng ký tài khoản mới
    register: async (req, res) => {
        let connection;
        try {
            const { email, password, full_name, phone_number } = req.body;

            console.log('📝 Register request:', { email, full_name, phone_number });

            // 1. Validate input
            if (!email || !password || !full_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc: email, password, full_name'
                });
            }

            // Validate email format
            const normalizedEmail = String(email || '').trim().toLowerCase();
            if (!EMAIL_REGEX.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
            }

            // Validate password length
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự'
                });
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            // 2. Kiểm tra email đã tồn tại chưa
            const existingUser = await User.findByEmail(normalizedEmail, connection);
            if (existingUser) {
                await connection.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Email đã được đăng ký'
                });
            }

            // 3. Hash password
            console.log('🔐 Hashing password...');
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // 4. Tạo user mới
            console.log('👤 Creating user...');
            const userId = await User.create({
                email: normalizedEmail,
                password_hash,
                full_name,
                phone_number
            }, connection);
            console.log('✅ User created with ID:', userId);

            // 5. Gán role mặc định (customer = role_id 3)
            console.log('🎭 Assigning role...');
            await User.assignRole(userId, 3, connection);
            console.log('✅ Role assigned');

            // 6. Lấy thông tin user vừa tạo
            console.log('📋 Fetching user info...');
            const newUser = await User.findById(userId, connection);
            
            if (!newUser) {
                console.error('❌ User not found after creation');
                throw new Error('Lỗi khi lấy thông tin user');
            }

            await connection.commit();

            // 7. Tạo JWT token
            console.log('🔑 Creating JWT token...');
            const token = createAuthToken(userId, normalizedEmail, newUser.token_version || 1);
            console.log('✅ Token created');

            console.log('🎉 Registration successful');
            res.status(201).json({
                success: true,
                message: 'Đăng ký tài khoản thành công',
                data: {
                    user: newUser,
                    token
                }
            });
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error('❌ Rollback error:', rollbackError.message);
                }
            }

            console.error('❌ Register error:', error);
            console.error('Error stack:', error.stack);

            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Email đã được đăng ký'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Lỗi khi đăng ký tài khoản',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    // API Đăng nhập
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const normalizedEmail = String(email || '').trim().toLowerCase();

            // 1. Validate input
            if (!normalizedEmail || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu email hoặc password'
                });
            }

            // 2. Tìm user theo email
            const user = await User.findByEmail(normalizedEmail);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                });
            }

            // 3. Kiểm tra status
            if (user.status !== 'ACTIVE') {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản đã bị khóa'
                });
            }

            // 4. Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                });
            }

            // 5. Tạo JWT token
const token = createAuthToken(user.user_id, user.email, user.token_version || 1);
            const safeUser = await getUserWithRoles(user);

            res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    user: safeUser,
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi đăng nhập'
            });
        }
    },

    logout: async (req, res) => {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
            }

            await db.query(
                'UPDATE users SET token_version = token_version + 1 WHERE user_id = ?',
                [userId]
            );

            return res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Lỗi server khi đăng xuất' });
        }
    },

    // API đăng nhập bằng Facebook
    loginWithFacebook: async (req, res) => {
        try {
            const { accessToken } = req.body;

            if (!accessToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu accessToken Facebook'
                });
            }

            const facebookProfile = await fetchFacebookProfile(accessToken);
            const facebookId = String(facebookProfile.id || '').trim();
            let normalizedEmail = String(facebookProfile.email || '').trim().toLowerCase();

            // Some Facebook accounts do not expose email (missing permission or no email on account).
            // Use a deterministic fallback email so the user can still sign in.
            if (!EMAIL_REGEX.test(normalizedEmail)) {
                if (!facebookId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Không lấy được thông tin tài khoản Facebook hợp lệ'
                    });
                }
                normalizedEmail = `${facebookId}@facebook.local`;
            }

            let user = await User.findByEmail(normalizedEmail);

            if (!user) {
                const password_hash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
                const userId = await User.create({
                    email: normalizedEmail,
                    password_hash,
                    full_name: facebookProfile.name || normalizedEmail,
                    phone_number: null
                });

                try {
                    await User.assignRole(userId, 3);
                } catch (roleError) {
                    console.error('Facebook role assignment error:', roleError.message);
                }

                user = await User.findById(userId);
            }

            if (!user) {
                return res.status(500).json({
                    success: false,
                    message: 'Không thể tạo hoặc lấy thông tin tài khoản Facebook'
                });
            }

            if (user.status !== 'ACTIVE') {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản đã bị khóa'
                });
            }

const token = createAuthToken(user.user_id, user.email, user.token_version || 1);
            const safeUser = await getUserWithRoles(user);

            return res.status(200).json({
                success: true,
                message: 'Đăng nhập Facebook thành công',
                data: {
                    user: safeUser,
                    token
                }
            });
        } catch (error) {
            console.error('Facebook login error:', error);
            return res.status(401).json({
                success: false,
                message: error.message || 'Đăng nhập Facebook thất bại'
            });
        }
    },

    // API gửi mã xác thực đặt lại mật khẩu
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const normalizedEmail = String(email || '').trim().toLowerCase();

            if (!EMAIL_REGEX.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
            }

            const user = await User.findByEmail(normalizedEmail);
            if (user) {
                // Xóa các mã cũ của email này
                await PasswordReset.deleteOldCodes(normalizedEmail);

                // Tạo mã xác thực 6 số
                const resetCode = generateResetCode();

                // Tính thời gian hết hạn (15 phút)
                const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

                // Lưu vào database
                await PasswordReset.create(user.user_id, normalizedEmail, resetCode, expiresAt);

                // Gửi email
                await sendResetCodeEmail({
                    to: user.email,
                    fullName: user.full_name,
                    resetCode
                });

                console.log(`✅ Reset code sent to ${normalizedEmail}`);
            }

            // Luôn trả success để tránh lộ email tồn tại hay không
            res.status(200).json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi mã xác thực về email của bạn.'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xử lý yêu cầu quên mật khẩu'
            });
        }
    },

    
    // API xác thực mã reset password
    verifyResetCode: async (req, res) => {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu email hoặc mã xác thực'
                });
            }

            const normalizedEmail = String(email || '').trim().toLowerCase();
            if (!EMAIL_REGEX.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
            }

            const resetCode = await PasswordReset.findValidCode(normalizedEmail, code);

            if (!resetCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã xác thực không hợp lệ hoặc đã hết hạn'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Mã xác thực hợp lệ'
            });
        } catch (error) {
            console.error('Verify reset code error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xác thực mã'
            });
        }
    },
    // API đặt lại mật khẩu bằng mã xác thực
    resetPassword: async (req, res) => {
        try {
            const { email, code, newPassword } = req.body;

            if (!email || !code || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu email, mã xác thực hoặc mật khẩu mới'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
                });
            }

            const normalizedEmail = String(email || '').trim().toLowerCase();
            if (!EMAIL_REGEX.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
            }

            // Kiểm tra mã xác thực
            const resetCode = await PasswordReset.findValidCode(normalizedEmail, code);

            if (!resetCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã xác thực không hợp lệ hoặc đã hết hạn'
                });
            }

            // Tìm user
            const user = await User.findById(resetCode.user_id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tài khoản'
                });
            }

            // Đặt lại mật khẩu
            const password_hash = await bcrypt.hash(newPassword, 10);
            await User.updatePassword(user.user_id, password_hash);

            // Đánh dấu mã đã sử dụng
            await PasswordReset.markAsUsed(resetCode.id);

            console.log(`✅ Password reset successful for ${normalizedEmail}`);

            res.status(200).json({
                success: true,
                message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi đặt lại mật khẩu'
            });
        }
    },

    getAllUserAdmin: async (req, res) => {
        try {
            const users = await User.getAllUserAdmin();
            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Error fetching admin users:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách người dùng hệ thống'
            });
        }
    }
};

module.exports = authController;
