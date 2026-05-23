const db = require('../config/db');

const BlogCategory = {
    getAll: async () => {
        const [rows] = await db.query('SELECT category_name, created_at FROM blog_categories ORDER BY created_at DESC');
        return rows;
    },
    getById: async (id) => {
        const [rows] = await db.query('SELECT category_id, category_name, description FROM blog_categories WHERE category_id = ?', [id]);
        return rows[0] || null;
    },
    create: async (data) => {
        const { category_name, description } = data;
        const [result] = await db.query(
            'INSERT INTO blog_categories (category_name, description) VALUES (?, ?)',
            [category_name, description || null]
        );
        return result.insertId;
    },
    update: async (id, data) => {
        const { category_name, description } = data;
        await db.query(
            'UPDATE blog_categories SET category_name = ?, description = ? WHERE category_id = ?',
            [category_name, description, id]
        );
    },
    delete: async (id) => {
        await db.query('DELETE FROM blog_categories WHERE category_id = ?', [id]);
    }
};

module.exports = BlogCategory;