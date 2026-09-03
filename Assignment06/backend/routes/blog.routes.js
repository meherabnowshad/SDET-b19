import { Router } from 'express';
import {
    createBlog,
    deleteBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
} from '../controllers/blog.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
    blogIdRule,
    createBlogRules,
    listBlogRules,
    updateBlogRules,
} from '../validators/blog.validator.js';

const router = Router();

router.get('/', listBlogRules, validate, getAllBlogs);

router.post('/create', authenticate, createBlogRules, validate, createBlog);
router.put('/update/:id', authenticate, updateBlogRules, validate, updateBlog);

router.delete('/delete/:id', authenticate, blogIdRule, validate, deleteBlog);

router.get('/:id', blogIdRule, validate, getBlogById);
router.delete('/:id', authenticate, blogIdRule, validate, deleteBlog);

export default router;
