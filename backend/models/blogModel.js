const db = require('../config/db');

const Blog = {
    // ============ BLOG CATEGORIES ============
    
    // Tạo danh mục tin tức
    createCategory: async (data) => {
        const { category_name, description } = data;
        const query = `
            INSERT INTO blog_categories (category_name, description) 
            VALUES (?, ?)
        `;
        const [result] = await db.query(query, [category_name, description || null]);
        return result.insertId;
    },

    // Lấy tất cả danh mục
    getAllCategories: async () => {
        const query = `
            SELECT bc.*, COUNT(bp.post_id) as post_count 
            FROM blog_categories bc 
            LEFT JOIN blog_posts bp ON bc.category_id = bp.category_id 
            GROUP BY bc.category_id 
            ORDER BY bc.created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // Lấy danh mục theo ID
    getCategoryById: async (categoryId) => {
        const query = `
            SELECT bc.*, COUNT(bp.post_id) as post_count 
            FROM blog_categories bc 
            LEFT JOIN blog_posts bp ON bc.category_id = bp.category_id 
            WHERE bc.category_id = ? 
            GROUP BY bc.category_id
        `;
        const [rows] = await db.query(query, [categoryId]);
        return rows[0];
    },

    // Cập nhật danh mục
    updateCategory: async (categoryId, data) => {
        const { category_name, description } = data;
        const query = `
            UPDATE blog_categories 
            SET category_name = ?, description = ? 
            WHERE category_id = ?
        `;
        const [result] = await db.query(query, [category_name, description, categoryId]);
        return result.affectedRows > 0;
    },

    // Xóa danh mục
    deleteCategory: async (categoryId) => {
        const query = 'DELETE FROM blog_categories WHERE category_id = ?';
        const [result] = await db.query(query, [categoryId]);
        return result.affectedRows > 0;
    },

    // ============ BLOG POSTS ============
    
    // Tạo bài viết
    createPost: async (data) => {
        const { category_id, author_id, title, thumbnail_url, content_html, status } = data;
        const query = `
            INSERT INTO blog_posts 
            (category_id, author_id, title, thumbnail_url, content_html, status, published_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const published_at = status === 'PUBLISHED' ? new Date() : null;
        const values = [
            category_id || null, 
            author_id, 
            title, 
            thumbnail_url || null, 
            content_html, 
            status || 'DRAFT',
            published_at
        ];
        const [result] = await db.query(query, values);
        return result.insertId;
    },

    // Lấy tất cả bài viết (cho admin)
    getAllPosts: async () => {
        const query = `
            SELECT 
                bp.*,
                bc.category_name,
                u.full_name AS author_name,
                u.email AS author_email
            FROM blog_posts bp
            LEFT JOIN blog_categories bc ON bp.category_id = bc.category_id
            LEFT JOIN users u ON bp.author_id = u.user_id
            ORDER BY bp.published_at DESC, bp.post_id DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // Lấy bài viết đã publish (cho public)
    getPublishedPosts: async (limit = null, offset = 0) => {
        let query = `
            SELECT 
                bp.post_id,
                bp.title,
                bp.thumbnail_url,
                bp.content_html,
                bp.view_count,
                bp.published_at,
                bc.category_id,
                bc.category_name,
                u.full_name AS author_name
            FROM blog_posts bp
            LEFT JOIN blog_categories bc ON bp.category_id = bc.category_id
            LEFT JOIN users u ON bp.author_id = u.user_id
            WHERE bp.status = 'PUBLISHED'
            ORDER BY bp.published_at DESC
        `;
        
        if (limit) {
            query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
        }
        
        const [rows] = await db.query(query);
        return rows;
    },

    // Lấy bài viết theo danh mục
    getPostsByCategory: async (categoryId) => {
        const query = `
            SELECT 
                bp.*,
                bc.category_name,
                u.full_name AS author_name
            FROM blog_posts bp
            LEFT JOIN blog_categories bc ON bp.category_id = bc.category_id
            LEFT JOIN users u ON bp.author_id = u.user_id
            WHERE bp.category_id = ? AND bp.status = 'PUBLISHED'
            ORDER BY bp.published_at DESC
        `;
        const [rows] = await db.query(query, [categoryId]);
        return rows;
    },

    // Lấy bài viết theo ID
    getPostById: async (postId) => {
        const query = `
            SELECT 
                bp.*,
                bc.category_id,
                bc.category_name,
                u.full_name AS author_name,
                u.email AS author_email
            FROM blog_posts bp
            LEFT JOIN blog_categories bc ON bp.category_id = bc.category_id
            LEFT JOIN users u ON bp.author_id = u.user_id
            WHERE bp.post_id = ?
        `;
        const [rows] = await db.query(query, [postId]);
        return rows[0];
    },

    // Cập nhật bài viết
    updatePost: async (postId, data) => {
        const { category_id, title, thumbnail_url, content_html, status } = data;
        
        // Nếu chuyển sang PUBLISHED, cập nhật thời gian publish
        let published_at = null;
        if (status === 'PUBLISHED') {
            // Kiểm tra xem bài viết đã từng được publish chưa
            const currentPost = await Blog.getPostById(postId);
            published_at = currentPost.published_at || new Date();
        }
        
        const query = `
            UPDATE blog_posts 
            SET category_id = ?, title = ?, thumbnail_url = ?, 
                content_html = ?, status = ?, published_at = ?
            WHERE post_id = ?
        `;
        const values = [
            category_id || null,
            title,
            thumbnail_url || null,
            content_html,
            status,
            published_at,
            postId
        ];
        const [result] = await db.query(query, values);
        return result.affectedRows > 0;
    },

    // Xóa bài viết
    deletePost: async (postId) => {
        const query = 'DELETE FROM blog_posts WHERE post_id = ?';
        const [result] = await db.query(query, [postId]);
        return result.affectedRows > 0;
    },

    // Tăng lượt xem
    incrementViewCount: async (postId) => {
        const query = 'UPDATE blog_posts SET view_count = view_count + 1 WHERE post_id = ?';
        const [result] = await db.query(query, [postId]);
        return result.affectedRows > 0;
    },
    // Cập nhật trạng thái bài viết (DRAFT | PUBLISHED | HIDDEN)
    updatePostStatus: async (postId, status) => {
        // Lấy bài hiện tại để xử lý published_at hợp lý
        const currentPost = await Blog.getPostById(postId);
        if (!currentPost) return false;

        let published_at = currentPost.published_at || null;

        // Nếu chuyển sang PUBLISHED lần đầu thì set thời gian publish
        if (status === 'PUBLISHED' && !published_at) {
            published_at = new Date();
        }

        // Nếu chuyển về DRAFT thì bỏ published_at
        if (status === 'DRAFT') {
            published_at = null;
        }

        // Nếu HIDDEN: giữ nguyên published_at cũ
        const query = `
            UPDATE blog_posts
            SET status = ?, published_at = ?
            WHERE post_id = ?
        `;
        const [result] = await db.query(query, [status, published_at, postId]);
        return result.affectedRows > 0;
    },

    // Tìm kiếm bài viết
    searchPosts: async (keyword) => {
        const query = `
            SELECT 
                bp.post_id,
                bp.title,
                bp.thumbnail_url,
                bp.view_count,
                bp.published_at,
                bc.category_name,
                u.full_name AS author_name
            FROM blog_posts bp
            LEFT JOIN blog_categories bc ON bp.category_id = bc.category_id
            LEFT JOIN users u ON bp.author_id = u.user_id
            WHERE bp.status = 'PUBLISHED' 
            AND (bp.title LIKE ? OR bp.content_html LIKE ?)
            ORDER BY bp.published_at DESC
        `;
        const searchTerm = `%${keyword}%`;
        const [rows] = await db.query(query, [searchTerm, searchTerm]);
        return rows;
    },

    // Lấy bài viết liên quan
    getRelatedPosts: async (postId, categoryId, limit = 4) => {
        const query = `
            SELECT 
                bp.post_id,
                bp.title,
                bp.thumbnail_url,
                bp.published_at,
                bc.category_name
            FROM blog_posts bp
            LEFT JOIN blog_categories bc ON bp.category_id = bc.category_id
            WHERE bp.status = 'PUBLISHED' 
            AND bp.post_id != ?
            AND bp.category_id = ?
            ORDER BY bp.published_at DESC
            LIMIT ?
        `;
        const [rows] = await db.query(query, [postId, categoryId, limit]);
        return rows;
    }
};

module.exports = Blog;
