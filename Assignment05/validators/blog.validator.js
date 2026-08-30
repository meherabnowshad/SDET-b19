import { body, param, query } from 'express-validator';

export const blogIdRule = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Blog id must be a positive integer.')
        .toInt(),
];

export const createBlogRules = [
    body('blogTitle')
        .exists({ values: 'falsy' })
        .withMessage('blogTitle is required.')
        .bail()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('blogTitle cannot be empty.')
        .isLength({ max: 255 })
        .withMessage('blogTitle cannot be longer than 255 characters.'),

    body('blog')
        .exists({ values: 'falsy' })
        .withMessage('blog content is required.')
        .bail()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('blog content cannot be empty.'),

    body('category')
        .exists({ values: 'falsy' })
        .withMessage('category is required.')
        .bail()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('category cannot be empty.')
        .isLength({ max: 100 })
        .withMessage('category cannot be longer than 100 characters.'),

    body('userId')
        .not()
        .exists()
        .withMessage('userId cannot be provided; it is taken from the logged in user.'),
];

export const updateBlogRules = [
    ...blogIdRule,

    body('blogTitle')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('blogTitle cannot be empty.')
        .isLength({ max: 255 })
        .withMessage('blogTitle cannot be longer than 255 characters.'),

    body('blog')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('blog content cannot be empty.'),

    body('category')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('category cannot be empty.')
        .isLength({ max: 100 })
        .withMessage('category cannot be longer than 100 characters.'),

    body('userId')
        .not()
        .exists()
        .withMessage('userId cannot be changed.'),

    body().custom((value) => {
        const updatable = ['blogTitle', 'blog', 'category'];
        if (!updatable.some((field) => value?.[field] !== undefined)) {
            throw new Error('Provide at least one of: blogTitle, blog, category.');
        }
        return true;
    }),
];

export const listBlogRules = [
    query('title')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('title search term cannot be empty.'),

    query('category')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('category filter cannot be empty.'),
];
