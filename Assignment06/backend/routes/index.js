import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import blogRoutes from './blog.routes.js';

const router = Router();

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Blog Management API is running.',
        endpoints: {
            auth: [
                'POST /api/auth/register',
                'POST /api/auth/login',
                'POST /api/auth/forgot-password',
                'PATCH /api/auth/reset-password/:token',
            ],
            users: [
                'GET /api/users (admin)',
                'GET /api/users/:id (admin)',
                'PATCH /api/users/:id/status (admin)',
                'GET /api/users/profile',
                'PUT /api/users/profile/update',
                'PATCH /api/users/profile/image (multipart, field: image)',
                'PATCH /api/users/password',
            ],
            blogs: [
                'GET /api/blogs?title=&category= (public)',
                'GET /api/blogs/:id (public)',
                'POST /api/blogs/create',
                'PUT /api/blogs/update/:id',
                'DELETE /api/blogs/delete/:id',
            ],
        },
    });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/blogs', blogRoutes);

export default router;
