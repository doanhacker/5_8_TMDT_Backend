const db = require('../config/db');
const { create } = require('./userModel');

const News = {
    //api thêm mới tin tức
    createNews: async (data) => {
        const { title, content, image_url, creator_id } = data;
        const query = `
            INSERT INTO news (title, content, image_url, creator_id) 
            VALUES (?, ?, ?, ?)
        `;
        const values = [title, content, image_url || null, creator_id || null];
        const [result] = await db.query(query, values);
        return result.insertId; // Trả về ID của tin tức vừa thêm
    },
    //api lấy danh sách tin tức sẽ được thêm sau

    getAllNews: async () => {
        const query = 'SELECT n.news_id, n.title, n.content, n.image_url, n.created_at, u.full_name AS creator_name FROM news n LEFT JOIN users u ON n.creator_id = u.user_id ORDER BY n.created_at DESC';
        const [rows] = await db.query(query);
        return rows;
    }   

};

module.exports = News;
