const mediaController = {
    // API upload media (ảnh, video) cho news editor
    uploadMedia: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng chọn file để upload!' 
                });
            }

            // req.file.path là URL từ Cloudinary sau khi upload thành công
            const mediaUrl = req.file.path;
            const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

            res.status(200).json({ 
                success: true, 
                message: 'Upload media thành công!',
                data: {
                    url: mediaUrl,
                    type: mediaType,
                    originalName: req.file.originalname
                }
            });
        } catch (error) {
            console.error('Media upload error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi khi upload media: ' + error.message 
            });
        }
    }
};

module.exports = mediaController;
