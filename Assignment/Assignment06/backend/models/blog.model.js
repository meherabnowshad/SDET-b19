import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Blog = sequelize.define(
    'Blog',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        blogTitle: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { notEmpty: true },
        },
        blog: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { notEmpty: true },
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { notEmpty: true },
        },
    },
    {
        tableName: 'blogs',
        timestamps: true,
        createdAt: 'createAt',
        updatedAt: 'updateAt',
    }
);

export default Blog;
