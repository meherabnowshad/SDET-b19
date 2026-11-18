import { Op, Sequelize } from 'sequelize';
import { Blog, User, AUTHOR_ATTRIBUTES } from '../models/index.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const withAuthor = {
    include: [{ model: User, as: 'author', attributes: AUTHOR_ATTRIBUTES }],
};

function escapeLike(value) {
    return value.replace(/[%_\\]/g, '\\$&');
}

export const getAllBlogs = asyncHandler(async (req, res) => {
    const { title, category } = req.query;
    const where = {};

    if (title) {
        const escaped = escapeLike(title.trim());

        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('blogTitle')), {
                [Op.like]: `%${escaped.toLowerCase()}%`,
            })
        );
    }
    if (category) {
        const escaped = escapeLike(category.trim());
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
            Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('category')), escaped.toLowerCase())
        );
    }

    const blogs = await Blog.findAll({
        where,
        ...withAuthor,
        order: [['id', 'DESC']],
    });

    res.status(200).json({
        success: true,
        message: 'Blogs fetched successfully.',
        count: blogs.length,
        filters: { title: title || null, category: category || null },
        data: blogs,
    });
});

export const getBlogById = asyncHandler(async (req, res) => {
    const blog = await Blog.findByPk(req.params.id, withAuthor);
    if (!blog) {
        throw ApiError.notFound(`Blog with id ${req.params.id} was not found.`);
    }

    res.status(200).json({
        success: true,
        message: 'Blog fetched successfully.',
        data: blog,
    });
});

export const createBlog = asyncHandler(async (req, res) => {
    const { blogTitle, blog, category } = req.body;

    const created = await Blog.create({
        userId: req.user.id,
        blogTitle,
        blog,
        category,
    });

    const result = await Blog.findByPk(created.id, withAuthor);

    res.status(201).json({
        success: true,
        message: 'Blog created successfully.',
        data: result,
    });
});

async function findBlogForWrite(id, user, action) {
    const blog = await Blog.findByPk(id);
    if (!blog) {
        throw ApiError.notFound(`Blog with id ${id} was not found.`);
    }

    const isOwner = blog.userId === user.id;
    if (!isOwner && user.role !== 'admin') {
        throw ApiError.forbidden(`You are not authorized to ${action} this blog.`);
    }

    return blog;
}

export const updateBlog = asyncHandler(async (req, res) => {
    const blog = await findBlogForWrite(req.params.id, req.user, 'update');

    const { blogTitle, blog: content, category } = req.body;
    const updates = {};
    if (blogTitle !== undefined) updates.blogTitle = blogTitle;
    if (content !== undefined) updates.blog = content;
    if (category !== undefined) updates.category = category;

    await blog.update(updates);

    const result = await Blog.findByPk(blog.id, withAuthor);

    res.status(200).json({
        success: true,
        message: 'Blog updated successfully.',
        data: result,
    });
});

export const deleteBlog = asyncHandler(async (req, res) => {
    const blog = await findBlogForWrite(req.params.id, req.user, 'delete');

    await blog.destroy();

    res.status(200).json({
        success: true,
        message: 'Blog deleted successfully.',
        data: { id: Number(req.params.id) },
    });
});
