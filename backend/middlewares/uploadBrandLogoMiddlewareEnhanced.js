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

let uploadBrandLogo;

if (hasCloudinaryConfig) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const brandStorage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'laptop_ecommerce/brands',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 800, height: 800, crop: 'limit' }]
        }
    });

    uploadBrandLogo = multer({ storage: brandStorage });
} else {
    const localUploadDir = path.join(__dirname, '..', 'uploads', 'brands');
    fs.mkdirSync(localUploadDir, { recursive: true });

    const diskStorage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, localUploadDir),
        filename: (req, file, cb) => {
            const safeName = String(file.originalname || 'brand-logo').replace(/\s+/g, '_');
            cb(null, `${Date.now()}-${safeName}`);
        }
    });

    uploadBrandLogo = multer({ storage: diskStorage });
}

module.exports = uploadBrandLogo;
