const db = require('../config/db');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const { VALID_ORDER_STATUSES } = require('../helpers/orderValidationHelper'); // Dùng để kiểm tra trạng thái đơn hàng

const REVIEW_STATUSES = ['VISIBLE', 'DELETED_BY_USER', 'DELETED_BY_ADMIN']; // Consistent với ENUM trong DB

const Review = {
    /**
     * Kiểm tra xem người dùng đã mua một variant cụ thể và đơn hàng đã hoàn tất chưa.
     * @param {number} userId - ID người dùng.
     * @param {number} variantId - ID phiên bản sản phẩm.
     * @returns {Promise<boolean>} true nếu đã mua và nhận hàng, false nếu ngược lại.
     */
    hasUserPurchasedAndReceived: async (userId, variantId) => {
        const [rows] = await db.query(
            `SELECT COUNT(od.id) AS count
             FROM order_details od
             JOIN orders o ON od.order_id = o.order_id
             WHERE od.variant_id = ?
               AND o.user_id = ?
               AND o.status = 'COMPLETED'`, // Chỉ cho phép đánh giá khi đơn hàng đã HOÀN TẤT
            [variantId, userId]
        );
        return rows[0].count > 0;
    },

    /**
     * Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa.
     * @param {number} userId - ID người dùng.
     * @param {number} productId - ID sản phẩm.
     * @returns {Promise<Object|null>} Đối tượng review (có thể là đã xóa) hoặc null nếu không có.
     */
    hasUserReviewedProduct: async (userId, productId) => { // THAY ĐỔI: Sửa logic
        const [rows] = await db.query(
            `SELECT review_id, status, is_visible -- Lấy cả is_visible
             FROM product_reviews
             WHERE user_id = ? AND product_id = ?
             LIMIT 1`,
            [userId, productId]
        );
        return rows[0] || null;
    },

    /**
     * Tạo một bài đánh giá mới, bao gồm ảnh (nếu có).
     * @param {Object} reviewData - Dữ liệu đánh giá (product_id, user_id, rating, content).
     * @param {Array<string>} imageUrls - Mảng các URL ảnh đánh giá.
     * @returns {Promise<number>} ID của review vừa được tạo.
     */
    create: async (reviewData, imageUrls = [], connection = db) => {
        const localConnection = connection === db ? await db.getConnection() : connection;
        try {
            if (connection === db) { // Chỉ bắt đầu transaction nếu không được truyền connection
                await localConnection.beginTransaction();
            }

            const { product_id, user_id, rating, content } = reviewData;

            const [result] = await localConnection.query( // Sử dụng localConnection
                `INSERT INTO product_reviews (product_id, user_id, rating, content, status)
                 VALUES (?, ?, ?, ?, 'VISIBLE')`, // Mặc định là VISIBLE
                [product_id, user_id, rating, content || null]
            );
            const newReviewId = result.insertId;

            // Thêm ảnh nếu có
            if (imageUrls.length > 0) {
                const imageInsertQuery = 'INSERT INTO review_images (review_id, image_url) VALUES (?, ?)';
                for (const url of imageUrls) {
                    await localConnection.query(imageInsertQuery, [newReviewId, url]);
                }
            }

            if (connection === db) { // Chỉ commit nếu là transaction của hàm này
                await localConnection.commit();
            }
            return newReviewId;
        } catch (error) {
            if (connection === db) {
                await localConnection.rollback();
            }
            // Bắt lỗi ER_DUP_ENTRY và chuyển thành thông báo lỗi rõ ràng hơn
            if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('unique_visible_review')) {
                throw new Error('Bạn đã có đánh giá hiển thị cho sản phẩm này. Bạn chỉ có thể sửa hoặc xóa đánh giá cũ.');
            }
            throw error;
        } finally {
            if (connection === db) {
                localConnection.release();
            }
        }
    },

    /**
     * Lấy một bài đánh giá theo ID.
     * @param {number} reviewId - ID của bài đánh giá.
     * @param {number|null} requestingUserId - ID của người dùng đang yêu cầu (để áp dụng quyền hiển thị).
     * @param {boolean} isAdmin - true nếu người dùng đang yêu cầu là admin.
     * @returns {Promise<Object|null>} Đối tượng đánh giá hoặc null.
     */
    getById: async (reviewId, requestingUserId = null, isAdmin = false) => {
        // Base query để lấy review và user
        let query = `
            SELECT
                pr.review_id,
                pr.product_id,
                pr.user_id,
                u.full_name AS reviewer_name,
                pr.rating,
                pr.content,
                pr.created_at,
                pr.status,
                pr.admin_deletion_reason
            FROM product_reviews pr
            JOIN users u ON pr.user_id = u.user_id
            WHERE pr.review_id = ?
        `;
        const params = [reviewId];

        // THAY ĐỔI LỚN TẠI ĐÂY: Áp dụng quy tắc hiển thị rõ ràng hơn
        query += ` AND (
                     pr.status = 'VISIBLE' `; // Luôn hiển thị nếu là VISIBLE

        if (isAdmin) {
            // Admin xem được cả VISIBLE và DELETED_BY_ADMIN
            query += ` OR pr.status = 'DELETED_BY_ADMIN' `;
        }
        
        if (requestingUserId) {
            // Chính người đánh giá xem được đánh giá của mình dù bị xóa bởi user hay admin
            query += ` OR (pr.user_id = ? AND (pr.status = 'DELETED_BY_USER' OR pr.status = 'DELETED_BY_ADMIN')) `;
            params.push(requestingUserId);
        }

        query += ` ) LIMIT 1`; // Đóng ngoặc của điều kiện OR lớn

        const [reviewRows] = await db.query(query, params);
        const review = reviewRows[0] || null;

        if (review) {
            // Lấy ảnh liên quan
            const [imageRows] = await db.query(
                'SELECT review_image_id, image_url FROM review_images WHERE review_id = ?',
                [review.review_id]
            );
            review.images = imageRows;
        }
        return review;
    },

    /**
     * Cập nhật một bài đánh giá.
     * @param {number} reviewId - ID của bài đánh giá.
     * @param {number} userId - ID người dùng đang cập nhật (để kiểm tra quyền).
     * @param {boolean} isAdmin - true nếu là admin.
     * @param {Object} updateData - Dữ liệu cập nhật (rating, content, status, admin_deletion_reason).
     * @param {Array<string>} newImageUrls - Mảng URL ảnh mới.
     * @param {Array<number>} deleteImageIds - Mảng ID ảnh cần xóa.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    update: async (reviewId, userId, isAdmin, updateData, newImageUrls = [], deleteImageIds = []) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { rating, content, status, admin_deletion_reason } = updateData;

            // Lấy review hiện tại để kiểm tra quyền và status
            const [currentReviewRows] = await connection.query(
                'SELECT product_id, user_id, status FROM product_reviews WHERE review_id = ? FOR UPDATE',
                [reviewId]
            );
            if (currentReviewRows.length === 0) {
                throw new Error('Đánh giá không tồn tại.');
            }
            const currentReview = currentReviewRows[0];

            // Chỉ người dùng hoặc admin mới có thể cập nhật/xóa
            if (!isAdmin && currentReview.user_id !== userId) {
                throw new Error('Bạn không có quyền sửa đánh giá này.');
            }

            // Xây dựng query UPDATE cho product_reviews
            const setClauses = [];
            const values = [];

            if (rating !== undefined) { setClauses.push('rating = ?'); values.push(rating); }
            if (content !== undefined) { setClauses.push('content = ?'); values.push(content || null); }

            // Admin có thể cập nhật status và reason
            if (isAdmin && status !== undefined) {
                if (!REVIEW_STATUSES.includes(status)) throw new Error('INVALID_REVIEW_STATUS');
                setClauses.push('status = ?');
                values.push(status);

                if (status === 'DELETED_BY_ADMIN') {
                    if (admin_deletion_reason === undefined || admin_deletion_reason.trim() === '') {
                        throw new Error('Lý do xóa bởi Admin không được để trống.');
                    }
                    setClauses.push('admin_deletion_reason = ?');
                    values.push(admin_deletion_reason);
                    setClauses.push('deleted_by_admin_at = NOW()'); // Set thời gian xóa
                } else {
                    setClauses.push('admin_deletion_reason = NULL'); // Xóa lý do nếu không phải DELETED_BY_ADMIN
                    setClauses.push('deleted_by_admin_at = NULL'); // Xóa thời gian xóa
                }
            } else if (!isAdmin && status === 'DELETED_BY_USER') { // Người dùng chỉ có thể tự xóa
                if (status !== 'DELETED_BY_USER') throw new Error('Người dùng không thể thay đổi trạng thái thành giá trị này.');
                setClauses.push('status = ?');
                values.push(status);
                setClauses.push('admin_deletion_reason = NULL');
                setClauses.push('deleted_by_admin_at = NULL');   // Xóa thời gian xóa
            } else if (!isAdmin && status !== undefined) { // Người dùng không thể thay đổi status khác
                 throw new Error('Người dùng chỉ có thể xóa đánh giá của mình hoặc cập nhật nội dung/ảnh.');
            }


            if (setClauses.length === 0 && newImageUrls.length === 0 && deleteImageIds.length === 0) {
                await connection.rollback();
                return 0; // Không có thay đổi nào
            }

            // Cập nhật bản ghi review
            if (setClauses.length > 0) {
                values.push(reviewId);
                await connection.query(`UPDATE product_reviews SET ${setClauses.join(', ')} WHERE review_id = ?`, values);
            }

            // Quản lý ảnh:
            // 1. Xóa ảnh cũ trên Cloudinary và DB (nếu có)
            if (deleteImageIds.length > 0) {
                const [imagesToDelete] = await connection.query(
                    'SELECT image_url FROM review_images WHERE review_image_id IN (?) AND review_id = ?',
                    [deleteImageIds, reviewId]
                );
                // Xóa trên Cloudinary
                for (const img of imagesToDelete) {
                    const publicId = img.image_url.split('/').pop().split('.')[0]; // Lấy public_id từ URL
                    await cloudinary.uploader.destroy(`laptop_ecommerce/reviews/${publicId}`); // Cần import cloudinary
                }
                // Xóa trong DB
                await connection.query('DELETE FROM review_images WHERE review_image_id IN (?) AND review_id = ?', [deleteImageIds, reviewId]);
            }

            // 2. Thêm ảnh mới vào DB
            if (newImageUrls.length > 0) {
                const imageInsertQuery = 'INSERT INTO review_images (review_id, image_url) VALUES (?, ?)';
                for (const url of newImageUrls) {
                    await connection.query(imageInsertQuery, [reviewId, url]);
                }
            }

            await connection.commit();
            return 1; // Giả sử 1 dòng bị ảnh hưởng cho review chính
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Lấy danh sách các đánh giá cần xóa cứng sau thời gian quy định (dùng bởi cron job).
     * @param {number} days - Số ngày tối thiểu kể từ khi bị xóa bởi Admin.
     * @returns {Promise<Array<Object>>} Danh sách review_id và các ảnh liên quan.
     */
    getReviewsForHardDeletion: async (days) => { 
        const [reviews] = await db.query(
            `SELECT 
                pr.review_id, 
                ri.review_image_id, 
                ri.image_url 
             FROM product_reviews pr
             LEFT JOIN review_images ri ON pr.review_id = ri.review_id
             WHERE pr.status = 'DELETED_BY_ADMIN'
               AND pr.deleted_by_admin_at < (NOW() - INTERVAL ? DAY)`, // Đã quá X ngày
            [days]
        );

        // Gom các ảnh theo review_id
        const groupedReviews = {};
        for (const row of reviews) {
            if (!groupedReviews[row.review_id]) {
                groupedReviews[row.review_id] = {
                    review_id: row.review_id,
                    images: []
                };
            }
            if (row.review_image_id) { // Chỉ thêm nếu có ảnh
                groupedReviews[row.review_id].images.push({
                    review_image_id: row.review_image_id,
                    image_url: row.image_url
                });
            }
        }
        return Object.values(groupedReviews);
    },

    /**
     * Xóa vật lý các ảnh liên quan đến một đánh giá trên Cloudinary.
     * @param {number} reviewId - ID của bài đánh giá.
     * @param {Object} connection - Database connection.
     * @returns {Promise<void>}
     */
    hardDeleteReviewImages: async (reviewId, connection) => {
        const [imagesToDelete] = await connection.query(
            'SELECT image_url FROM review_images WHERE review_id = ?',
            [reviewId]
        );
        for (const img of imagesToDelete) {
            const publicId = img.image_url.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`laptop_ecommerce/reviews/${publicId}`);
        }
        await connection.query('DELETE FROM review_images WHERE review_id = ?', [reviewId]); // Xóa khỏi DB sau khi xóa Cloudinary
    },

    /**
     * Xóa vật lý một bài đánh giá khỏi database (dùng bởi cron job).
     * @param {number} reviewId - ID của bài đánh giá.
     * @param {Object} connection - Database connection.
     * @returns {Promise<number>} Số dòng bị ảnh hưởng.
     */
    hardDelete: async (reviewId, connection) => {
        const [result] = await connection.query('DELETE FROM product_reviews WHERE review_id = ?', [reviewId]);
        return result.affectedRows;
    }
};

module.exports = Review;