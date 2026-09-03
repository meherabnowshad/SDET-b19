import { User } from '../models/index.js';
import env from '../config/env.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signResetToken, signToken, verifyResetToken } from '../utils/token.js';

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

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    // Never reveal whether the email exists — same message either way.
    if (!user) {
        return res.status(200).json({
            success: true,
            message: 'If an account exists for this email, a password reset link has been sent.',
        });
    }

    const token = signResetToken(user);
    const resetUrl = `${env.frontendUrl.replace(/\/$/, '')}/reset-password/${token}`;

    // No real mailer in this assignment: log the link and (dev convenience)
    // return it so the frontend/Postman flow can be completed end to end.
    console.log(`[auth] password reset for ${email}: ${resetUrl}`);

    res.status(200).json({
        success: true,
        message: 'If an account exists for this email, a password reset link has been sent.',
        data: { resetUrl, token },
    });
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    let payload;
    try {
        payload = verifyResetToken(token);
    } catch (err) {
        const message =
            err.name === 'TokenExpiredError'
                ? 'Password reset link has expired. Please request a new one.'
                : 'Password reset link is invalid.';
        throw ApiError.badRequest(message);
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
        throw ApiError.badRequest('Password reset link is invalid.');
    }

    user.password = req.body.password;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password successfully changed.',
    });
});
