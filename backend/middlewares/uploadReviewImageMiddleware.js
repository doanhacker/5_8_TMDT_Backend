const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// 1. Cấu hình thông tin đăng nhập Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Cấu hình kho lưu trữ trên mây cho ảnh đánh giá
const reviewStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'laptop_ecommerce/reviews', // Thư mục riêng cho ảnh đánh giá
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 600, height: 600, crop: 'limit' }] // Kích thước phù hợp cho ảnh đánh giá
    }
});

// 3. Khởi tạo Multer với bộ nhớ mây
const uploadReview = multer({ storage: reviewStorage });

module.exports = uploadReview;