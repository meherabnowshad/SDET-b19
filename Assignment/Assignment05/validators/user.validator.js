import { body, param } from 'express-validator';
import { PASSWORD_MIN_LENGTH } from './auth.validator.js';

export const userIdRule = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('User id must be a positive integer.')
        .toInt(),
];

export const updateStatusRules = [
    ...userIdRule,
    body('isActive')
        .exists()
        .withMessage('isActive is required.')
        .bail()
        .isBoolean()
        .withMessage('isActive must be a boolean value (true or false).')
        .toBoolean(),
];

export const updateProfileRules = [
    body('firstname')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('firstname cannot be empty.')
        .isLength({ max: 50 })
        .withMessage('firstname cannot be longer than 50 characters.'),

    body('lastname')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('lastname cannot be empty.')
        .isLength({ max: 50 })
        .withMessage('lastname cannot be longer than 50 characters.'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('A valid email address is required.')
        .normalizeEmail(),

    body().custom((value) => {
        const updatable = ['firstname', 'lastname', 'email'];
        if (!updatable.some((field) => value?.[field] !== undefined)) {
            throw new Error('Provide at least one of: firstname, lastname, email.');
        }
        return true;
    }),
];

export const updatePasswordRules = [
    body('password')
        .exists({ values: 'falsy' })
        .withMessage('password is required.')
        .bail()
        .isString()
        .isLength({ min: PASSWORD_MIN_LENGTH })
        .withMessage(`password must be at least ${PASSWORD_MIN_LENGTH} characters long.`),
];
