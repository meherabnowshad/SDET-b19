import { User } from '../models/index.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';

export const authenticate = asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
        throw ApiError.unauthorized('Authentication token is missing.');
    }

    const token = header.slice(7).trim();
    if (!token) {
        throw ApiError.unauthorized('Authentication token is missing.');
    }

    let payload;
    try {
        payload = verifyToken(token);
    } catch (err) {
        const message =
            err.name === 'TokenExpiredError'
                ? 'Authentication token has expired.'
                : 'Authentication token is invalid.';
        throw ApiError.unauthorized(message);
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
        throw ApiError.unauthorized('The user attached to this token no longer exists.');
    }
    if (!user.isActive) {
        throw ApiError.forbidden('Your account has been deactivated.');
    }

    req.user = user;
    next();
});

export const rejectProtectedFields =
    (...fields) =>
        (req, res, next) => {
            const attempted = fields.filter((field) => field in (req.body || {}));

            if (attempted.length > 0) {
                return next(
                    ApiError.forbidden(
                        `You are not allowed to update ${attempted.join(' or ')} through this endpoint.`
                    )
                );
            }
            return next();
        };

export const authorize =
    (...roles) =>
        (req, res, next) => {
            if (!req.user) {
                return next(ApiError.unauthorized());
            }
            if (!roles.includes(req.user.role)) {
                return next(
                    ApiError.forbidden('This resource is restricted to administrators.')
                );
            }
            return next();
        };
