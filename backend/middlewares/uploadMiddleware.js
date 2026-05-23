const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET
);

const imageFileFilter = (req, file, cb) => {
    if (!file || !file.mimetype) {
        return cb(new Error('File upload không hợp lệ'));
    }
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Chỉ cho phép upload file ảnh'));
    }
    cb(null, true);
};

let storage;

if (hasCloudinaryConfig) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'laptop_ecommerce/sliders',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 1920, height: 1080, crop: 'limit' }]
        }
    });
} else {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'sliders');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase();
            const safeExt = ext || '.jpg';
            cb(null, `slider-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
        }
    });

    console.warn('[uploadMiddleware] Cloudinary chưa cấu hình. Fallback sang local /uploads/sliders');
}

const uploadSlider = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});

module.exports = uploadSlider;