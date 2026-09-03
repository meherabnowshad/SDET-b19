import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// One outstanding registration OTP per email. Only the bcrypt hash is stored —
// a leaked database never reveals a usable code.
const Otp = sequelize.define(
    'Otp',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        otpHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        attempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: 'otps',
        timestamps: true,
        createdAt: 'createAt',
        updatedAt: 'updateAt',
    }
);

export default Otp;
