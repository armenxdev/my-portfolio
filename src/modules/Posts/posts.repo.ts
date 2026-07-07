import { prisma } from "../../config/prisma";
import { Post } from "@prisma/client";

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedPostsResult {
    posts: Post[];
    meta: PaginationMeta;
}

export interface GetPostsFilters {
    page: number;
    limit: number;
    search?: string;
    tags?: string[];
    category?: string;
    sort: 'latest' | 'oldest';
}

export class PostsRepo {
    async create(postData: any): Promise<Post> {
        return prisma.post.create({
            data: {
                title: postData.title,
                slug: postData.slug,
                content: postData.content,
                tags: postData.tags || [],
                category: postData.category,
                adminId: postData.adminId,
            }
        });
    }

    async getFilteredAndPaginated(filters: GetPostsFilters): Promise<PaginatedPostsResult> {
        const { page, limit, search, tags, category, sort } = filters;
        const skip = (page - 1) * limit;
        const orderBy = sort === 'oldest' ? 'asc' : 'desc';

        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (tags && tags.length > 0) {
            where.tags = { hasEvery: tags };
        }

        if (category) {
            where.category = category;
        }

        const [posts, totalCount] = await Promise.all([
            prisma.post.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    created_at: orderBy,
                },
            }),
            prisma.post.count({ where }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            posts,
            meta: {
                total: totalCount,
                page,
                limit,
                totalPages: totalPages,
            },
        };
    }

    async findBySlug(slug: string): Promise<Post | null> {
        return prisma.post.findUnique({
            where: { slug },
        });
    }

    async save(post: any): Promise<Post> {
        const { id, ...data } = post;
        if (id) {
            return prisma.post.update({
                where: { id },
                data,
            });
        }
        return prisma.post.create({ data });
    }

    async delete(slug: string): Promise<boolean> {
        const result = await prisma.post.delete({
            where: { slug },
        });
        return !!result;
    }

    async getAllTags(): Promise<string[]> {
        const posts = await prisma.post.findMany({
            select: { tags: true },
        });
        const tags = new Set<string>();
        posts.forEach(post => {
            post.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }
}