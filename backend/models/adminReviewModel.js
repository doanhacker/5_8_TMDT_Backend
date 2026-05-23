const db = require('../config/db');

const AdminReviewModel = {
    getAllReviews: async () => {
        const [rows] = await db.query(
            `SELECT
                pr.review_id,
                pr.product_id,
                p.product_name,
                pr.user_id,
                u.full_name AS reviewer_name,
                pr.rating,
                pr.content,
                pr.created_at
            FROM product_reviews pr
            JOIN products p ON pr.product_id = p.product_id
            JOIN users u ON pr.user_id = u.user_id
            ORDER BY pr.created_at DESC`
        );
        return rows;
    },

    deleteReviewById: async (reviewId) => {
        const [result] = await db.query('DELETE FROM product_reviews WHERE review_id = ?', [reviewId]);
        return result.affectedRows;
    }
};

module.exports = AdminReviewModel;
