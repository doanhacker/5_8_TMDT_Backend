const Slider = require('../models/sliderModel');

const resolveUploadedImageUrl = (file) => {
    if (!file) return '';

    // Cloudinary thường trả URL ở file.path hoặc file.url
    if (file.path && /^https?:\/\//i.test(file.path)) return file.path;
    if (file.url && /^https?:\/\//i.test(file.url)) return file.url;

    // Fallback local disk storage -> public URL qua /uploads
    if (file.filename) return `/uploads/sliders/${file.filename}`;

    return file.path || '';
};

const sliderController = {
    // API Lấy danh sách Slider (GET)
    getAllSliders: async (req, res) => {
        try {
            const sliders = await Slider.getAllVisible();
            res.status(200).json({ 
                success: true, 
                message: 'Lấy dữ liệu thành công',
                data: sliders 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },
    // Admin
    getAllSlidersForAdmin: async (req, res) => {
        try {
            const sliders = await Slider.getAllForAdmin();
            return res.status(200).json({
                success: true,
                message: 'Lấy dữ liệu admin thành công',
                data: sliders
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    //API Lấy chi tiết Slider theo ID (GET)
    getSliderById: async (req, res) => {
        try {
            const {id} = req.params;
            const slider = await Slider.getById(id);
            if (!slider) {
                return res.status(404).json({ success: false, message: 'Slider không tồn tại!' });
            }
            res.status(200).json({ 
                success: true, 
                message: 'Lấy dữ liệu thành công',
                data: slider 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
        }

    },

    // API Thêm mới Slider (POST)
    createSlider: async (req, res) => {
        try {
            const { title, link_url, display_order, status, image_url } = req.body;
            
            let finalImageUrl;
            
            // Ưu tiên file upload, nếu không có thì dùng URL từ form
            if (req.file) {
                finalImageUrl = resolveUploadedImageUrl(req.file);
            } else if (image_url && image_url.trim()) {
                finalImageUrl = image_url.trim(); // URL nhập tay
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng upload ảnh hoặc nhập URL ảnh!' 
                });
            }

            // Tạo dữ liệu slider
            const sliderData = {
                title,
                image_url: finalImageUrl,
                link_url,
                display_order,
                status,
                creator_id: null // Tạm thời để null vì chưa làm đăng nhập Admin
            };

            const newId = await Slider.create(sliderData);

            res.status(201).json({ 
                success: true, 
                message: 'Thêm Slider thành công!',
                data: { id: newId, image_url: finalImageUrl }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi thêm Slider' });
        }
    },

    //API Cập nhật Slider (PUT)
    updateSlider: async (req, res) => {
        try {
            const { id } = req.params;
            const existingSlider = await Slider.getById(id);
            if (!existingSlider) {
                return res.status(404).json({ success: false, message: 'Slider không tồn tại!' });
            }
            
            const updateData = { ...req.body };
            
            // Ưu tiên file upload, nếu không có thì kiểm tra image_url từ form
            if (req.file) {
                updateData.image_url = resolveUploadedImageUrl(req.file);
            } else if (req.body.image_url && req.body.image_url.trim()) {
                updateData.image_url = req.body.image_url.trim(); // URL nhập tay
            }
            
            const affectedRows = await Slider.update(id, updateData);
            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Không có trường nào được cập nhật!' });
            }

            res.status(200).json({ 
                success: true, 
                message: 'Cập nhật Slider thành công!'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật Slider' });

        }
    },

    //API xóa mềm Slider (DELETE)
    deleteSlider: async (req, res) => {
        try{
            const { id } = req.params;
            const existingSlider = await Slider.getById(id);
            if (!existingSlider) {
                return res.status(404).json({ success: false, message: 'Slider không tồn tại!' });
            }
            const affectedRows = await Slider.softDelete(id);
            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Không thể xóa Slider!' });
            }

            res.status(200).json({ 
                success: true, 
                message: 'Xóa Slider thành công!'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi xóa Slider' });
        }
    }

};

module.exports = sliderController;
