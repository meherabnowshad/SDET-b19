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
