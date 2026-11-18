import { Router } from 'express';
import { login, register } from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { loginRules, registerRules } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);

export default router;
