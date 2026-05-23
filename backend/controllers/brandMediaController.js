const toStoredImageUrl = (file) => {
    if (!file) return null;
    if (file.path && /^https?:\/\//i.test(file.path)) {
        return file.path;
    }
    if (file.filename) {
        return `/uploads/brands/${file.filename}`;
    }
    return file.path || null;
};

const brandMediaController = {
    uploadLogo: async (req, res) => {
        try {
            const logoUrl = toStoredImageUrl(req.file);
            if (!logoUrl) {
                return res.status(400).json({ success: false, message: 'Không nhận được file logo hợp lệ' });
            }

            return res.status(200).json({
                success: true,
                message: 'Upload logo thành công',
                data: { logo_url: logoUrl }
            });
        } catch (error) {
            console.error('Error uploading brand logo:', error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    }
};

module.exports = brandMediaController;
