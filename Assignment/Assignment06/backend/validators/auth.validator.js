import { body, param } from 'express-validator';

const PASSWORD_MIN_LENGTH = 6;

const otpRule = body('otp')
    .exists({ values: 'falsy' })
    .withMessage('Verification code is required.')
    .bail()
    .isString()
    .withMessage('Verification code must be 6 digits.')
    .bail()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits.')
    .bail()
    .matches(/^\d{6}$/)
    .withMessage('Verification code must be 6 digits.');

const baseRegisterRules = [
    body('firstname')
        .exists({ values: 'falsy' })
        .withMessage('firstname is required.')
        .bail()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('firstname cannot be empty.')
        .isLength({ max: 50 })
        .withMessage('firstname cannot be longer than 50 characters.'),

    body('lastname')
        .exists({ values: 'falsy' })
        .withMessage('lastname is required.')
        .bail()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('lastname cannot be empty.')
        .isLength({ max: 50 })
        .withMessage('lastname cannot be longer than 50 characters.'),

    body('email')
        .exists({ values: 'falsy' })
        .withMessage('email is required.')
        .bail()
        .isEmail()
        .withMessage('A valid email address is required.')
        .normalizeEmail(),

    body('password')
        .exists({ values: 'falsy' })
        .withMessage('password is required.')
        .bail()
        .isString()
        .isLength({ min: PASSWORD_MIN_LENGTH })
        .withMessage(`password must be at least ${PASSWORD_MIN_LENGTH} characters long.`),
];

export const loginRules = [
    body('email')
        .exists({ values: 'falsy' })
        .withMessage('email is required.')
        .bail()
        .isEmail()
        .withMessage('A valid email address is required.')
        .normalizeEmail(),

    body('password')
        .exists({ values: 'falsy' })
        .withMessage('password is required.')
        .bail()
        .isString()
        .isLength({ min: PASSWORD_MIN_LENGTH })
        .withMessage(`password must be at least ${PASSWORD_MIN_LENGTH} characters long.`),
];

// Step 1 (request OTP) and Step 2 (verify + create account) share the same
// account payload; Step 2 additionally requires the 6-digit code.
export const sendRegisterOtpRules = [...baseRegisterRules];

export const registerRules = [...baseRegisterRules, otpRule];

export const forgotPasswordRules = [
    body('email')
        .exists({ values: 'falsy' })
        .withMessage('email is required.')
        .bail()
        .isEmail()
        .withMessage('A valid email address is required.')
        .normalizeEmail(),
];

export const resetPasswordRules = [
    param('token')
        .exists({ values: 'falsy' })
        .withMessage('Reset token is required.')
        .bail()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Reset token cannot be empty.'),

    body('password')
        .exists({ values: 'falsy' })
        .withMessage('password is required.')
        .bail()
        .isString()
        .isLength({ min: PASSWORD_MIN_LENGTH })
        .withMessage(`password must be at least ${PASSWORD_MIN_LENGTH} characters long.`),
];

export { PASSWORD_MIN_LENGTH };
