import { User } from '../models/index.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

export const register = asyncHandler(async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
        throw ApiError.conflict('This email is already registered.');
    }

    const user = await User.create({
        firstname,
        lastname,
        email,
        password,
        role: 'user',
        isActive: true,
    });

    res.status(201).json({
        success: true,
        message: 'Registration successful.',
        data: user,
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
        throw ApiError.unauthorized('Invalid email or password.');
    }

    if (!user.isActive) {
        throw ApiError.forbidden(
            'Your account has been deactivated. Please contact an administrator.'
        );
    }

    res.status(200).json({
        success: true,
        message: 'Login successful.',
        token: signToken(user),
        data: user,
    });
});
