const cron = require('node-cron');
const db = require('../config/db');
const Review = require('../models/reviewModel'); 

// Thời gian chờ trước khi xóa cứng sau khi bị Admin xóa (tính bằng ngày)
const DAYS_TO_HARD_DELETE_REVIEWS = 15;

const startReviewCleanupJob = () => {
    // Lịch chạy cron: mỗi ngày vào lúc 00:00 (nửa đêm)
    // Hoặc mỗi phút trong quá trình dev để dễ test: '* * * * *'
    cron.schedule('0 0 * * *', async () => { // Chạy vào 00:00 mỗi ngày
        console.log(`[CRON JOB] Bắt đầu quét đánh giá để xóa cứng (sau ${DAYS_TO_HARD_DELETE_REVIEWS} ngày)...`);
        const connection = await db.getConnection(); // Lấy một connection riêng cho cron job
        try {
            await connection.beginTransaction();

            const reviewsToHardDelete = await Review.getReviewsForHardDeletion(DAYS_TO_HARD_DELETE_REVIEWS);

            if (reviewsToHardDelete.length === 0) {
                console.log('[CRON JOB] Không tìm thấy đánh giá nào cần xóa cứng.');
                await connection.commit();
                return;
            }

            console.log(`[CRON JOB] Tìm thấy ${reviewsToHardDelete.length} đánh giá cần xóa cứng.`);

            for (const review of reviewsToHardDelete) {
                try {
                    // Xóa ảnh trên Cloudinary và trong bảng review_images
                    await Review.hardDeleteReviewImages(review.review_id, connection);
                    // Xóa bản ghi review chính
                    await Review.hardDelete(review.review_id, connection);
                    console.log(`[CRON JOB] Đã xóa cứng đánh giá ID: ${review.review_id} và các ảnh liên quan.`);
                } catch (innerError) {
                    console.error(`[CRON JOB] Lỗi khi xóa cứng đánh giá ID ${review.review_id}:`, innerError);
                    // Tiếp tục xử lý các đánh giá khác, nhưng log lỗi
                }
            }

            await connection.commit();
            console.log('[CRON JOB] Hoàn tất quét và xóa cứng đánh giá.');

        } catch (error) {
            await connection.rollback();
            console.error('[CRON JOB] Lỗi tổng quát trong cron job xóa đánh giá:', error);
        } finally {
            connection.release();
        }
    });
    console.log('[CRON JOB] Đã khởi tạo cron job xóa đánh giá.');
};

module.exports = { startReviewCleanupJob };