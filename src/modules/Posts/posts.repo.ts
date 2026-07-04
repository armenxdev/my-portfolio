import { AppDataSource } from "../../config/data-source";
import { Post } from "../../entities/Posts";

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
    private repo = AppDataSource.getRepository(Post);

    async create(postData: Partial<Post>): Promise<Post> {
        const newPost = this.repo.create(postData);
        return this.repo.save(newPost);
    }

    async getFilteredAndPaginated(filters: GetPostsFilters): Promise<PaginatedPostsResult> {
        const { page, limit, search, tags, category, sort } = filters;
        const queryBuilder = this.repo.createQueryBuilder('post');

        if (search) {
            queryBuilder.andWhere(
                'post.title ILIKE :search OR post.content ILIKE :search',
                { search: `%${search}%` }
            );
        }

        if (tags && tags.length > 0) {
            queryBuilder.andWhere('post.tags && :tags', { tags });
        }

        if (category) {
            queryBuilder.andWhere('post.category = :category', { category });
        }

        const orderDirection = sort === 'oldest' ? 'ASC' : 'DESC';
        queryBuilder.orderBy('post.created_at', orderDirection);

        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        const [posts, totalCount] = await queryBuilder.getManyAndCount();

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
        return this.repo.findOneBy({ slug });
    }

    async save(post: Post): Promise<Post> {
        return this.repo.save(post);
    }

    async delete(slug: string): Promise<boolean> {
        const result = await this.repo.delete({ slug });
        return (result.affected ?? 0) > 0;
    }

    async getAllTags(): Promise<string[]> {
        const result = await this.repo
            .createQueryBuilder("post")
            .select("DISTINCT unnest(post.tags)", "tag")
            .orderBy("tag", "ASC")
            .getRawMany();

        return result.map((row: { tag: string }) => row.tag);
    }
}