import fs from 'fs';
import path from 'path';
import { User } from '../models/index.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadsDir } from '../middlewares/upload.middleware.js';

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

export const uploadProfileImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw ApiError.badRequest('Profile image file is required (field: image).');
    }

    const newPath = `/uploads/${req.file.filename}`;

    // Remove the previous file so uploads/ does not fill with orphans.
    const old = req.user.profileImage;
    if (old && old.startsWith('/uploads/') && old !== newPath) {
        const oldFile = path.join(uploadsDir, path.basename(old));
        fs.promises.unlink(oldFile).catch(() => {});
    }

    await req.user.update({ profileImage: newPath });

    res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully.',
        data: req.user,
    });
});
