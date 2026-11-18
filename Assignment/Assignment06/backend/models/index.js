import sequelize from '../config/database.js';
import User from './user.model.js';
import Blog from './blog.model.js';
import Otp from './otp.model.js';

User.hasMany(Blog, { foreignKey: 'userId', as: 'blogs', onDelete: 'CASCADE' });
Blog.belongsTo(User, { foreignKey: 'userId', as: 'author' });

export const AUTHOR_ATTRIBUTES = ['id', 'firstname', 'lastname', 'profileImage'];

async function assertTimestampColumns() {
    const [rows] = await sequelize.query(
        `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName
           FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('users', 'blogs')
            AND COLUMN_NAME IN ('createdAt', 'updatedAt')`
    );

    if (rows.length > 0) {
        const stale = rows.map((r) => `${r.tableName}.${r.columnName}`).join(', ');
        throw new Error(
            `Legacy timestamp columns found (${stale}). ` +
            `Run "npm run db:setup" once to rename them to createAt / updateAt.`
        );
    }
}

export async function initDB() {
    await sequelize.authenticate();
    await sequelize.sync();
    await assertTimestampColumns();
    await ensureProfileImageColumn();
    console.log('Database connected and models synced');
}

async function ensureProfileImageColumn() {
    const [rows] = await sequelize.query(
        `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profileImage'`
    );
    if (rows.length === 0) {
        await sequelize.query(
            'ALTER TABLE `users` ADD COLUMN `profileImage` VARCHAR(500) NULL DEFAULT NULL'
        );
        console.log('Added missing users.profileImage column');
    }
}

export async function closeDB() {
    await sequelize.close();
}

export { sequelize, User, Blog, Otp };
