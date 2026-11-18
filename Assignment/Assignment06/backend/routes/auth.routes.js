import { Router } from 'express';
import {
    forgotPassword,
    login,
    register,
    resetPassword,
    sendRegisterOtp,
} from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import {
    forgotPasswordRules,
    loginRules,
    registerRules,
    resetPasswordRules,
    sendRegisterOtpRules,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register/send-otp', sendRegisterOtpRules, validate, sendRegisterOtp);
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.patch('/reset-password/:token', resetPasswordRules, validate, resetPassword);

export default router;
