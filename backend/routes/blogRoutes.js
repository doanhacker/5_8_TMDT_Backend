const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const uploadBlogMedia = require('../middlewares/uploadBlogMediaMiddleware');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');


router.get('/categories', blogController.getAllCategories);
router.get('/categories/:id', blogController.getCategoryById);
router.post('/categories', verifyToken, verifyAdmin, blogController.createCategory);
router.put('/categories/:id', verifyToken, verifyAdmin, blogController.updateCategory);
router.delete('/categories/:id', verifyToken, verifyAdmin, blogController.deleteCategory);
router.get('/posts/published', blogController.getPublishedPosts);
router.get('/posts/all', verifyToken, verifyAdmin, blogController.getAllPosts);


router.get('/posts/search', blogController.searchPosts);


router.get('/posts/category/:categoryId', blogController.getPostsByCategory);


router.get('/posts/:id/related', blogController.getRelatedPosts);


router.get('/posts/:id', blogController.getPostById);


router.post('/posts', verifyToken, verifyAdmin, blogController.createPost);


router.put('/posts/:id', verifyToken, verifyAdmin, blogController.updatePost);
router.patch('/posts/:id/status', verifyToken, verifyAdmin, blogController.updatePostStatus);

router.delete('/posts/:id', verifyToken, verifyAdmin, blogController.deletePost);
router.post('/media/upload', verifyToken, verifyAdmin, uploadBlogMedia.single('file'), blogController.uploadPostMedia);

module.exports = router;
