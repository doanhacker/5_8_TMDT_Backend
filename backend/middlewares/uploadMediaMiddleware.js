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

// 2. Cấu hình kho lưu trữ trên mây cho media (hình ảnh & video)
const mediaStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'laptop_ecommerce/news_media', // Thư mục riêng cho media tin tức
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov', 'avi'], // Cho phép ảnh và video
        resource_type: 'auto', // Tự động phát hiện loại resource (image, video, etc.)
        transformation: [{ width: 1200, crop: 'limit' }] // Giới hạn chiều rộng tối đa 1200px
    }
});

// 3. Khởi tạo Multer với bộ nhớ mây cho media
const uploadMedia = multer({ 
    storage: mediaStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // Giới hạn 50MB cho file
    }
});

module.exports = uploadMedia;
