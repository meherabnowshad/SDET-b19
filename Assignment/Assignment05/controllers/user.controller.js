import { User } from '../models/index.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.findAll({ order: [['id', 'ASC']] });

    res.status(200).json({
        success: true,
        message: 'Users fetched successfully.',
        count: users.length,
        data: users,
    });
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
        throw ApiError.notFound(`User with id ${req.params.id} was not found.`);
    }

    res.status(200).json({
        success: true,
        message: 'User fetched successfully.',
        data: user,
    });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
        throw ApiError.notFound(`User with id ${req.params.id} was not found.`);
    }

    await user.update({ isActive: req.body.isActive });

    res.status(200).json({
        success: true,
        message: `User has been ${user.isActive ? 'activated' : 'deactivated'}.`,
        data: user,
    });
});

export const getProfile = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Profile fetched successfully.',
        data: req.user,
    });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const { firstname, lastname, email } = req.body;

    if (email && email !== req.user.email) {
        const taken = await User.findOne({ where: { email } });
        if (taken) {
            throw ApiError.conflict('This email is already registered.');
        }
    }

    const updates = {};
    if (firstname !== undefined) updates.firstname = firstname;
    if (lastname !== undefined) updates.lastname = lastname;
    if (email !== undefined) updates.email = email;

    await req.user.update(updates);

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: req.user,
    });
});

export const updatePassword = asyncHandler(async (req, res) => {
    req.user.password = req.body.password;
    await req.user.save();

    res.status(200).json({
        success: true,
        message: 'Password updated successfully.',
    });
});
