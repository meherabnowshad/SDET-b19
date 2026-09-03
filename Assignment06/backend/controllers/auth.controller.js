import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Otp, User } from '../models/index.js';
import env from '../config/env.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { isMailConfigured, sendOtpEmail } from '../utils/email.js';
import { signResetToken, signToken, verifyResetToken } from '../utils/token.js';

const OTP_TTL_MINUTES = 2;
const OTP_MAX_ATTEMPTS = 5;

function makeOtp() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

export const sendRegisterOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
        throw ApiError.conflict('This email is already registered.');
    }

    const otp = makeOtp();
    await Otp.upsert({
        email,
        otpHash: await bcrypt.hash(otp, 10),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
        attempts: 0,
    });

    if (isMailConfigured()) {
        try {
            await sendOtpEmail(email, otp);
        } catch (err) {
            console.error('[auth] failed to send OTP email:', err.message);
            throw ApiError.badRequest('Could not send the verification email. Please try again.');
        }
        return res.status(200).json({
            success: true,
            message: `A 6-digit verification code was sent to ${email}. It expires in 10 minutes.`,
        });
    }

    // Dev mode (no Gmail configured): log the code and return it so the
    // flow stays testable end to end without a mailer.
    console.log(`[auth] REGISTER OTP for ${email}: ${otp}`);
    res.status(200).json({
        success: true,
        message: `A 6-digit verification code was sent to ${email}. It expires in 10 minutes.`,
        data: { devOtp: otp, mailConfigured: false },
    });
});

export const register = asyncHandler(async (req, res) => {
    const { firstname, lastname, email, password, otp } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
        throw ApiError.conflict('This email is already registered.');
    }

    const record = await Otp.findOne({ where: { email } });
    if (!record) {
        throw ApiError.badRequest('No verification code was requested for this email. Please request one first.');
    }
    if (record.expiresAt.getTime() < Date.now()) {
        await record.destroy();
        throw ApiError.badRequest('Verification code has expired. Please request a new one.');
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
        await record.destroy();
        throw ApiError.badRequest('Too many wrong attempts. Please request a new verification code.');
    }
    if (!(await bcrypt.compare(String(otp), record.otpHash))) {
        await record.increment('attempts');
        throw ApiError.badRequest('Incorrect verification code. Please try again.');
    }

    await record.destroy();

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
