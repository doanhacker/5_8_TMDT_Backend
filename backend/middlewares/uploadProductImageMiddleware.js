const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

let uploadProduct;

if (hasCloudinaryConfig) {
    // 1. Cấu hình thông tin đăng nhập Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // 2. Cấu hình kho lưu trữ trên mây cho ảnh sản phẩm
    const productStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'laptop_ecommerce/products',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 800, height: 800, crop: 'limit' }]
        }
    });

    uploadProduct = multer({ storage: productStorage });
} else {
    // Fallback local storage when Cloudinary env is missing.
    const localUploadDir = path.join(__dirname, '..', 'uploads', 'products');
    fs.mkdirSync(localUploadDir, { recursive: true });

    const diskStorage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, localUploadDir),
        filename: (req, file, cb) => {
            const safeName = file.originalname.replace(/\s+/g, '_');
            cb(null, `${Date.now()}-${safeName}`);
        }
    });

    uploadProduct = multer({ storage: diskStorage });
}

module.exports = uploadProduct;