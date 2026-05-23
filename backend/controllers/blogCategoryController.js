const blogCategoryModel = require('../models/blogCategoryModel');

const blogCategoryController = {
    getAll: async (req, res) =>{
        try {
            const categories = await blogCategoryModel.getAll();
            res.status(200).json(
                {
                    success: true,
                    data: categories
                }
            );
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    },
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await blogCategoryModel.getById(id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.status(200).json(
                {
                    success: true,
                    data: category
                }
            );
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({ error: 'Failed to fetch category' });
        }   
    },
    create: async (req, res) => {
        try {
            const { category_name, description } = req.body;
            if (!category_name) {
                return res.status(400).json({ error: 'Category name is required' });
            }
            const newId = await blogCategoryModel.create({ category_name, description });
            res.status(201).json(
                {
                    success: true,
                    message: "Tạo danh mục thành công",
                    data: { category_id: newId, category_name, description }
                }
            );
        } catch (error) {
            if(error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "Trùng tên danh mục, vui lòng chọn tên khác" });
            }
            console.error('Error creating category:', error);
            res.status(500).json({ error: 'Failed to create category' });
        }
    },
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const exiting = await blogCategoryModel.getById(id);
            if (!exiting) {
                return res.status(404).json({ error: 'Category not found' });
            }
            const affectedRows = await blogCategoryModel.update(id, req.body);
            if (affectedRows === 0) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.status(200).json(
                {
                    success: true,
                    message: "Cập nhật danh mục tin tức thành công",
                    data: { category_id: id, ...req.body }
                }
            );
        }
        catch (error) {
            if(error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "Trùng tên danh mục, vui lòng chọn tên khác" });
            }
            console.error('Error updating category:', error);
            res.status(500).json({ error: 'Failed to update category' });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const exiting = await blogCategoryModel.getById(id);
            if (!exiting) {
                return res.status(404).json({ error: 'Category not found' });
            }
            await blogCategoryModel.delete(id);
            res.status(200).json(
                {
                    success: true,
                    message: "Xóa danh mục tin tức thành công"
                }
            );
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ error: 'Failed to delete category' });
        }
    }

    };

    module.exports = blogCategoryController;