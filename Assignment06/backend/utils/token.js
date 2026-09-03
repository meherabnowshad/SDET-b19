import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    );
}

export function verifyToken(token) {
    return jwt.verify(token, env.jwt.secret);
}

export function signResetToken(user) {
    return jwt.sign({ id: user.id, email: user.email, purpose: 'password-reset' }, env.jwt.secret, {
        expiresIn: env.jwt.resetExpiresIn,
    });
}

export function verifyResetToken(token) {
    const payload = jwt.verify(token, env.jwt.secret);
    if (payload.purpose !== 'password-reset') {
        const err = new Error('Password reset token is invalid.');
        err.name = 'JsonWebTokenError';
        throw err;
    }
    return payload;
}
