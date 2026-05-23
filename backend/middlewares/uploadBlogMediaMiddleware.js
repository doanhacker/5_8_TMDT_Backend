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

const mediaFileFilter = (req, file, cb) => {
  if (!file || !file.mimetype) return cb(new Error('File không hợp lệ'));
  const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
  if (!ok) return cb(new Error('Chỉ cho phép ảnh hoặc video'));
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
    params: async (req, file) => ({
      folder: 'laptop_ecommerce/blog',
      resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image'
    })
  });
} else {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'blog');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
      cb(null, `blog-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  });
}

module.exports = multer({
  storage,
  fileFilter: mediaFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // video
});