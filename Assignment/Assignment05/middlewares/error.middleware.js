import ApiError from '../utils/apiError.js';

export const notFoundHandler = (req, res, next) => {
    next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist.`));
};

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error.';
    let errors = err.errors;

    if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = 'This email is already registered.';
        errors = err.errors?.map((e) => ({ field: e.path, message: e.message }));
    } else if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        errors = err.errors?.map((e) => ({ field: e.path, message: e.message }));
        message = errors?.[0]?.message || 'Validation failed.';
    } else if (err.name === 'SequelizeForeignKeyConstraintError') {
        statusCode = 400;
        message = 'Referenced record does not exist.';
    } else if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Request body is not valid JSON.';
    }

    if (statusCode === 500) {
        console.error(err);
        message = 'Internal server error.';
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(errors && errors.length ? { errors } : {}),
    });
};
