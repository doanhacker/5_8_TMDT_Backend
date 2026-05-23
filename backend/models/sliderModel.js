const db = require('../config/db');

const Slider = {
    // Hàm lấy tất cả banner, sắp xếp theo thứ tự hiển thị
    getAllVisible: async () => {
        const query = 'SELECT * FROM slider_banners WHERE status = "VISIBLE" ORDER BY display_order ASC';
        const [rows] = await db.query(query);
        return rows;
    },
    // Admin: lấy tất cả (VISIBLE + HIDDEN)
    getAllForAdmin: async () => {
        const query = `
            SELECT slider_id, creator_id, title, image_url, link_url, display_order, status
            FROM slider_banners
            ORDER BY display_order ASC, slider_id DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    //Hàm lấy banner theo ID 
    getById: async (id) => {
        const query = 'SELECT slider_id, creator_id, title, image_url, link_url, display_order, status FROM slider_banners WHERE slider_id = ? LIMIT 1';
        const [rows] = await db.query(query, [id]);
        return rows[0] || null; // Trả về null nếu không tìm thấy
    },

    // Hàm tạo banner mới
    create: async (data) => {
        // Trong thực tế creator_id sẽ lấy từ Token của Admin lúc đăng nhập, tạm thời truyền null hoặc id cố định
        const { title, image_url, link_url, display_order, status, creator_id } = data;
        
        const query = `
            INSERT INTO slider_banners 
            (title, image_url, link_url, display_order, status, creator_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        // Mặc định order là 0, status là VISIBLE nếu không truyền
        const values = [
            title, 
            image_url, 
            link_url || null, 
            display_order || 0, 
            status || 'VISIBLE', 
            creator_id || null
        ];

        const [result] = await db.query(query, values);
        return result.insertId; // Trả về ID của dòng vừa thêm
    },

    // Hàm cập nhật banner 
    
    update : async (id, data) => {
        const allowedFields = ['title', 'image_url', 'link_url', 'display_order', 'status'];
        const fieldsToUpdate = [];
        const values = [];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(data[field]);
            }
        });

        if (fieldsToUpdate.length === 0) {
            throw new Error('Không có trường nào để cập nhật');
        }
        values.push(id); // Thêm ID vào cuối mảng giá trị để dùng trong WHERE
        
        const query = `
            UPDATE slider_banners 
            SET ${fieldsToUpdate.join(', ')}
            WHERE slider_id = ?
        `;
        
        const [result] = await db.query(query, values);
        return result.affectedRows; 
    },

    // Hàm xóa mềm slider
    softDelete: async (id) => {
        const query = `
            UPDATE slider_banners 
            SET status = 'HIDDEN' 
            WHERE slider_id = ?
        `;
        const [result] = await db.query(query, [id]);
        return result.affectedRows; 
    }
};

module.exports = Slider;