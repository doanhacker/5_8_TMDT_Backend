const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const db = require('../config/db');
const { logAnalyticsEvent } = require('../services/analyticsEventService');

const { validateCartItemData, isValidCartId } = require('../helpers/cartValidationHelper');
const { isValidId } = require('../helpers/productValidationHelper'); // Dùng chung isValidId cho variant_id

const cartController = {
    /**
     * Hàm lấy cart_id dựa trên user_id (nếu đăng nhập) hoặc session_id (nếu là khách).
     * Sẽ tạo giỏ hàng nếu chưa có.
     * Trong ứng dụng thực tế, user_id sẽ từ req.user.user_id (middleware auth)
     * và session_id sẽ từ req.session.id (middleware express-session).
     * Để test, cần truyền user_id hoặc session_id trong body.
     */
    _getCartIdentifier: async (req, res, next) => {
        const userId = parseInt(req.body?.user_id || req.query?.user_id) || null;
        const sessionId = req.body?.session_id || req.query?.session_id || null;

        if (!userId && !sessionId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp user_id hoặc session_id.' });
        }

        try {
            const cart = await Cart.getOrCreateCart(userId, sessionId);
            req.cartId = cart.cart_id;
            req.userId = userId;
            req.sessionId = sessionId;
            next();
        } catch (error) {
            console.error('Lỗi khi lấy/tạo giỏ hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ khi xử lý giỏ hàng.' });
        }
    },


    //API: Lấy chi tiết giỏ hàng (GET /api/cart)
    getCart: async (req, res) => {
        try {
            const cartId = req.cartId; // Lấy từ middleware _getCartIdentifier
            const cartDetails = await Cart.getCartDetails(cartId);

            res.status(200).json({
                success: true,
                message: 'Lấy chi tiết giỏ hàng thành công',
                data: {
                    cart_id: cartId,
                    user_id: req.userId,
                    session_id: req.sessionId,
                    items: cartDetails
                }
            });
        } catch (error) {
            console.error('Lỗi khi lấy giỏ hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Thêm sản phẩm vào giỏ hàng (POST /api/cart/add)
     * req.body: { user_id | session_id, variant_id, quantity }
     */
    addItemToCart: async (req, res) => {
        try {
            const cartId = req.cartId; // Lấy từ middleware _getCartIdentifier
            const { variant_id, quantity } = req.body;

            // Validate dữ liệu item
            const itemErrors = validateCartItemData({ variant_id, quantity });
            if (itemErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu sản phẩm trong giỏ hàng', errors: itemErrors });
            }

            // Kiểm tra xem variant có tồn tại không và còn hàng không
            // Cần lấy thông tin chi tiết của variant để kiểm tra số lượng tồn kho
            const [variantRows] = await db.query('SELECT stock_quantity, status FROM product_variants WHERE variant_id = ?', [variant_id]);
            if (variantRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Phiên bản sản phẩm không tồn tại.' });
            }
            const variant = variantRows[0];

            if (variant.status !== 'IN_STOCK') {
                return res.status(400).json({ success: false, message: 'Phiên bản sản phẩm này hiện không có sẵn để thêm vào giỏ hàng.' });
            }
            if (variant.stock_quantity < quantity) {
                return res.status(400).json({ success: false, message: `Số lượng yêu cầu (${quantity}) vượt quá số lượng tồn kho (${variant.stock_quantity}).` });
            }


            const result = await Cart.addItem(cartId, variant_id, quantity);

            const [variantProductRows] = await db.query(
                'SELECT product_id FROM product_variants WHERE variant_id = ? LIMIT 1',
                [variant_id]
            );

            logAnalyticsEvent({
                eventType: 'cart_add',
                userId: req.body.user_id ? Number(req.body.user_id) : null,
                productId: variantProductRows[0]?.product_id || null,
                sessionId: req.body.session_id || req.headers['x-session-id'] || null,
                metadata: { variant_id: Number(variant_id), quantity: Number(quantity) },
            });

            res.status(200).json({
                success: true,
                message: 'Thêm sản phẩm vào giỏ hàng thành công!',
                data: { cart_id: cartId, variant_id, quantity_added: quantity }
            });
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Cập nhật số lượng sản phẩm trong giỏ hàng (PUT /api/cart/update)
     * req.body: { user_id | session_id, variant_id, quantity }
     */
    updateCartItemQuantity: async (req, res) => {
        try {
            const cartId = req.cartId;
            const { variant_id, quantity } = req.body;

            // Validate dữ liệu item
            const itemErrors = validateCartItemData({ variant_id, quantity });
            if (itemErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Lỗi dữ liệu sản phẩm trong giỏ hàng', errors: itemErrors });
            }

            // Kiểm tra xem variant có tồn tại không và còn hàng không
            const [variantRows] = await db.query('SELECT stock_quantity, status FROM product_variants WHERE variant_id = ?', [variant_id]);
            if (variantRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Phiên bản sản phẩm không tồn tại.' });
            }
            const variant = variantRows[0];

            if (variant.status !== 'IN_STOCK') {
                return res.status(400).json({ success: false, message: 'Phiên bản sản phẩm này hiện không có sẵn để cập nhật giỏ hàng.' });
            }
            if (variant.stock_quantity < quantity) {
                return res.status(400).json({ success: false, message: `Số lượng yêu cầu (${quantity}) vượt quá số lượng tồn kho (${variant.stock_quantity}).` });
            }

            const affectedRows = await Cart.updateItemQuantity(cartId, variant_id, quantity);

            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Không có thay đổi nào được thực hiện hoặc sản phẩm không có trong giỏ.' });
            }
            const cartDetails = await Cart.getCartDetails(cartId) ;
            res.status(200).json({
                success: true,
                message: 'Cập nhật số lượng sản phẩm trong giỏ hàng thành công!',
                data: { cart_id: cartId, items: cartDetails }
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật giỏ hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Xóa sản phẩm khỏi giỏ hàng (DELETE /api/cart/remove/:variantId)
     * req.body: { user_id | session_id }
     */
    removeItemFromCart: async (req, res) => {
        try {
            const cartId = req.cartId;
            const { variantId } = req.params;

            if (!isValidId(variantId)) {
                return res.status(400).json({ success: false, message: 'ID phiên bản sản phẩm không hợp lệ.' });
            }

            const affectedRows = await Cart.removeItem(cartId, variantId);

            if (affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại trong giỏ hàng để xóa.' });
            }

            const cartDetails = await Cart.getCartDetails(cartId);
            res.status(200).json({
                success: true,
                message: 'Xóa sản phẩm khỏi giỏ hàng thành công!',  
                data: { cart_id: cartId, items: cartDetails }
            });
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Xóa toàn bộ giỏ hàng (DELETE /api/cart/clear)
     * req.body: { user_id | session_id }
     */
    clearCart: async (req, res) => {
        try {
            const cartId = req.cartId;

            const affectedRows = await Cart.clearCart(cartId);

            res.status(200).json({
                success: true,
                message: `Đã xóa ${affectedRows} sản phẩm khỏi giỏ hàng thành công!`,
                data: { cart_id: cartId, items_cleared: affectedRows }
            });
        } catch (error) {
            console.error('Lỗi khi xóa toàn bộ giỏ hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    /**
     * API: Hợp nhất giỏ hàng (được gọi sau khi người dùng khách đăng nhập)
     * req.body: { session_id, user_id }
     */
    mergeCarts: async (req, res) => {
        try {
            const { session_id, user_id } = req.body;

            if (!session_id || !user_id || !isValidId(user_id)) {
                return res.status(400).json({ success: false, message: 'Vui lòng cung cấp session_id và user_id hợp lệ.' });
            }

            // Kiểm tra user_id có tồn tại không
            const [userExists] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [user_id]);
            if (userExists.length === 0) {
                return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
            }

            await Cart.mergeCarts(session_id, user_id);

            res.status(200).json({
                success: true,
                message: 'Giỏ hàng đã được hợp nhất thành công!'
            });
        } catch (error) {
            console.error('Lỗi khi hợp nhất giỏ hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    }

};

module.exports = cartController;