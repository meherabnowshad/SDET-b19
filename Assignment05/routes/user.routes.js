import { Router } from 'express';
import {
    getAllUsers,
    getProfile,
    getUserById,
    updatePassword,
    updateProfile,
    updateUserStatus,
} from '../controllers/user.controller.js';
import { authenticate, authorize, rejectProtectedFields } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
    updatePasswordRules,
    updateProfileRules,
    updateStatusRules,
    userIdRule,
} from '../validators/user.validator.js';

const router = Router();

router.get('/profile', authenticate, getProfile);

router.put(
    '/profile/update',
    authenticate,
    rejectProtectedFields('role', 'isActive'),
    updateProfileRules,
    validate,
    updateProfile
);
router.patch('/password', authenticate, updatePasswordRules, validate, updatePassword);

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, authorize('admin'), userIdRule, validate, getUserById);
router.patch(
    '/:id/status',
    authenticate,
    authorize('admin'),
    updateStatusRules,
    validate,
    updateUserStatus
);

export default router;
