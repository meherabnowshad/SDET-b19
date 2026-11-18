import { validationResult } from 'express-validator';
import ApiError from '../utils/apiError.js';

const validate = (req, res, next) => {
    const result = validationResult(req);

    if (result.isEmpty()) {
        return next();
    }

    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(ApiError.badRequest(errors[0].message, errors));
};

export default validate;
