import dotenv from 'dotenv';

dotenv.config();

const env = {
    port: process.env.PORT || 5001,
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        name: process.env.DB_NAME || 'blogdb',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'change_me_in_env',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || '1h',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    admin: {
        firstname: process.env.ADMIN_FIRSTNAME || 'Admin',
        lastname: process.env.ADMIN_LASTNAME || 'One',
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'password123',
    },
    bcryptRounds: 10,
};

export default env;
