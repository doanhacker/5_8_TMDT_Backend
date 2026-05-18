const db = require('../config/db');

const Cart = {
    /**
     * Lấy giỏ hàng theo user_id hoặc session_id, nếu không tồn tại thì tạo mới.
     * @param {number|null} userId - ID của người dùng (nếu đã đăng nhập)
     * @param {string|null} sessionId - ID session (nếu là khách)
     * @returns {Promise<Object>} Đối tượng giỏ hàng (cart_id, user_id, session_id)
     */
    getOrCreateCart: async (userId, sessionId) => {
        let cart = null;

        if (userId) {
            const [rows] = await db.query('SELECT cart_id, user_id, session_id FROM carts WHERE user_id = ? LIMIT 1', [userId]);
            if (rows.length > 0) {
                cart = rows[0];
            } else {
                // Tạo giỏ hàng mới cho người dùng
                const [result] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
                cart = { cart_id: result.insertId, user_id: userId, session_id: null };
            }
        } else if (sessionId) {
            const [rows] = await db.query('SELECT cart_id, user_id, session_id FROM carts WHERE session_id = ? AND user_id IS NULL LIMIT 1', [sessionId]);
            if (rows.length > 0) {
                cart = rows[0];
            } else {
                // Tạo giỏ hàng mới cho session
                const [result] = await db.query('INSERT INTO carts (session_id) VALUES (?)', [sessionId]);
                cart = { cart_id: result.insertId, user_id: null, session_id: sessionId };
            }
        } else {
            throw new Error('Phải cung cấp userId hoặc sessionId để lấy/tạo giỏ hàng.');
        }
        return cart;
    },

    /**
     * Lấy chi tiết giỏ hàng (các sản phẩm trong giỏ)
     * @param {number} cartId - ID của giỏ hàng
     * @returns {Promise<Array>} Mảng các sản phẩm trong giỏ với thông tin chi tiết
     */
    getCartDetails: async (cartId) => {
        const query = `
            SELECT
                cd.id AS cart_detail_id,
                cd.variant_id,
                pv.sku,
                p.product_id,
                p.product_name,
                pv.color_name,
                pv.ram_gb,
                pv.storage_gb,
                pv.original_price,
                pv.discount_price,
                pv.stock_quantity AS variant_stock_quantity,
                pv.status AS variant_status,
                cd.quantity,
                COALESCE(
                    (SELECT image_url FROM product_images WHERE variant_id = pv.variant_id AND is_primary = TRUE LIMIT 1),
                    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND variant_id IS NULL AND is_primary = TRUE LIMIT 1),
                    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND variant_id IS NULL ORDER BY image_id ASC LIMIT 1),
                    (SELECT image_url FROM product_images WHERE variant_id = pv.variant_id ORDER BY image_id ASC LIMIT 1)
                ) AS primary_variant_image_url
            FROM cart_details cd
            JOIN product_variants pv ON cd.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            WHERE cd.cart_id = ?
            ORDER BY cd.id ASC
        `;
        const [rows] = await db.query(query, [cartId]);
        return rows;
    },

    /**
     * Thêm một phiên bản sản phẩm vào giỏ hàng hoặc cập nhật số lượng nếu đã tồn tại.
     * @param {number} cartId - ID của giỏ hàng
     * @param {number} variantId - ID của phiên bản sản phẩm
     * @param {number} quantity - Số lượng cần thêm
     * @returns {Promise<number>} ID của cart_detail nếu là thêm mới, số dòng bị ảnh hưởng nếu cập nhật.
     */
    addItem: async (cartId, variantId, quantity) => {
        const [existingItem] = await db.query(
            'SELECT id, quantity FROM cart_details WHERE cart_id = ? AND variant_id = ? LIMIT 1',
            [cartId, variantId]
        );

        if (existingItem.length > 0) {
            // Nếu sản phẩm đã có trong giỏ, cập nhật số lượng
            const newQuantity = existingItem[0].quantity + quantity;
            const [result] = await db.query(
                'UPDATE cart_details SET quantity = ? WHERE id = ?',
                [newQuantity, existingItem[0].id]
            );
            return result.affectedRows; // Trả về số dòng bị ảnh hưởng
        } else {
            // Nếu sản phẩm chưa có, thêm mới
            const [result] = await db.query(
                'INSERT INTO cart_details (cart_id, variant_id, quantity) VALUES (?, ?, ?)',
                [cartId, variantId, quantity]
            );
            return result.insertId; // Trả về ID của chi tiết giỏ hàng mới
        }
    },

    /**
     * Cập nhật số lượng của một mục trong giỏ hàng.
     * @param {number} cartId - ID của giỏ hàng
     * @param {number} variantId - ID của phiên bản sản phẩm
     * @param {number} newQuantity - Số lượng mới
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    updateItemQuantity: async (cartId, variantId, newQuantity) => {
        if (newQuantity <= 0) {
            // Nếu số lượng là 0 hoặc âm, xóa item khỏi giỏ
            return Cart.removeItem(cartId, variantId);
        }
        const [result] = await db.query(
            'UPDATE cart_details SET quantity = ? WHERE cart_id = ? AND variant_id = ?',
            [newQuantity, cartId, variantId]
        );
        return result.affectedRows;
    },

    /**
     * Xóa một phiên bản sản phẩm khỏi giỏ hàng.
     * @param {number} cartId - ID của giỏ hàng
     * @param {number} variantId - ID của phiên bản sản phẩm
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    removeItem: async (cartId, variantId) => {
        const [result] = await db.query(
            'DELETE FROM cart_details WHERE cart_id = ? AND variant_id = ?',
            [cartId, variantId]
        );
        return result.affectedRows;
    },

    /**
     * Xóa toàn bộ sản phẩm khỏi giỏ hàng.
     * @param {number} cartId - ID của giỏ hàng
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    clearCart: async (cartId) => {
        const [result] = await db.query('DELETE FROM cart_details WHERE cart_id = ?', [cartId]);
        return result.affectedRows;
    },

    /**
     * Chức năng để hợp nhất giỏ hàng (khi khách đăng nhập)
     * @param {string} sessionId - ID session của khách
     * @param {number} userId - ID của người dùng đã đăng nhập
     * @returns {Promise<void>}
     */
    mergeCarts: async (sessionId, userId) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [guestCartRows] = await connection.query('SELECT cart_id FROM carts WHERE session_id = ? AND user_id IS NULL LIMIT 1', [sessionId]);
            const [userCartRows] = await connection.query('SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1', [userId]);

            let guestCartId = guestCartRows.length > 0 ? guestCartRows[0].cart_id : null;
            let userCartId = userCartRows.length > 0 ? userCartRows[0].cart_id : null;

            if (!guestCartId && !userCartId) {
                // Không có giỏ hàng nào để hợp nhất
                await connection.commit();
                return;
            }

            if (!userCartId) {
                // Nếu người dùng chưa có giỏ hàng, chuyển giỏ hàng của khách cho người dùng
                await connection.query('UPDATE carts SET user_id = ?, session_id = NULL WHERE cart_id = ?', [userId, guestCartId]);
            } else if (guestCartId) {
                // Nếu cả hai đều có giỏ hàng, hợp nhất các item từ giỏ khách vào giỏ người dùng
                const [guestItems] = await connection.query('SELECT variant_id, quantity FROM cart_details WHERE cart_id = ?', [guestCartId]);

                for (const item of guestItems) {
                    await connection.query(
                        `INSERT INTO cart_details (cart_id, variant_id, quantity)
                         VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
                        [userCartId, item.variant_id, item.quantity]
                    );
                }
                // Xóa giỏ hàng của khách sau khi hợp nhất
                await connection.query('DELETE FROM carts WHERE cart_id = ?', [guestCartId]);
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = Cart;
