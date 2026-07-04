import { Request, Response } from "express";
import { PostsService } from "./posts.svc";
import { asyncHandler } from "../../utils/async-handler";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/app-error";

const postsService = new PostsService();

export const createPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, content, tags, category } = req.body;

    if (!req.admin) {
        throw new AppError('Authentication required', 401);
    }

    const newPost = await postsService.createPost({
        title,
        content,
        tags: tags || [],
        category: category || null,
        adminId: req.admin.id,
    });

    res.status(201).json({
        success: true,
        data: newPost,
    });
});

export const getPublicPosts = asyncHandler(
    async (req: Request, res: Response) => {
        const { page, limit, sort, search, s, tags, category } = req.query;

        const parsedPage = parseInt(page as string, 10) || 1;
        const parsedLimit = parseInt(limit as string, 10) || 10;

        const searchQuery = (search as string || s as string || '').trim();

        const sortOrder = sort === 'oldest' ? 'oldest' : 'latest';

        let parsedTags: string[] | undefined = undefined;

        if (typeof tags === 'string' && tags.trim()) {
            parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        const { posts, meta } = await postsService.getAllPosts({
            page: parsedPage,
            limit: parsedLimit,
            search: searchQuery,
            tags: parsedTags,
            category: category as string | undefined,
            sort: sortOrder,
        });

        res.status(200).json({
            success: true,
            data: posts,
            meta,
        });
    },
);

export const getPostBySlug = asyncHandler(
    async (req: Request, res: Response) => {
        const slug = req.params.slug as string;
        const post = await postsService.getPostBySlug(slug);

        if (!post) {
            throw new AppError('Post not found', 404);
        }

        res.status(200).json({
            success: true,
            data: post,
        });
    },
);

export const getAllTags = asyncHandler(
    async (_req: Request, res: Response) => {
        const tags = await postsService.getAllTags();
        res.status(200).json({
            success: true,
            data: tags,
        });
    },
);

export const editPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = req.params.slug as string;
    const { title, content, tags, category } = req.body;

    if (!req.admin) {
        throw new AppError('Authentication required', 401);
    }

    const post = await postsService.getPostBySlug(slug);

    if (!post) {
        throw new AppError('Post not found', 404);
    }

    // Authorization check: only the post owner can edit
    if (post.adminId !== null && post.adminId !== req.admin.id) {
        throw new AppError('You do not have permission to edit this post', 403);
    }

    const updated = await postsService.updatePost(slug, { title, content, tags, category });

    if (!updated) {
        throw new AppError('Post not found', 404);
    }

    res.status(200).json({
        success: true,
        data: updated,
        message: 'Post updated successfully',
    });
});

export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = req.params.slug as string;

    if (!req.admin) {
        throw new AppError('Authentication required', 401);
    }

    const post = await postsService.getPostBySlug(slug);

    if (!post) {
        throw new AppError('Post not found', 404);
    }

    // Authorization check: only the post owner can delete
    if (post.adminId !== null && post.adminId !== req.admin.id) {
        throw new AppError('You do not have permission to delete this post', 403);
    }

    await postsService.delete(slug);

    res.status(200).json({
        success: true,
        data: null,
        message: 'Post deleted successfully',
    });
});