import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import env from '../config/env.js';

const User = sequelize.define(
    'User',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        firstname: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { notEmpty: true },
        },
        lastname: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { notEmpty: true },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        role: {
            type: DataTypes.ENUM('admin', 'user'),
            allowNull: false,
            defaultValue: 'user',
        },
    },
    {
        tableName: 'users',
        timestamps: true,
        createdAt: 'createAt',
        updatedAt: 'updateAt',

        defaultScope: {
            attributes: { exclude: ['password'] },
        },
        scopes: {
            withPassword: { attributes: { include: ['password'] } },
        },
    }
);

async function hashPassword(user) {
    if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, env.bcryptRounds);
    }
}

User.beforeCreate(hashPassword);
User.beforeUpdate(hashPassword);

User.prototype.comparePassword = function comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

export default User;
