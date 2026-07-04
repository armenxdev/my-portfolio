import { PostsRepo, PaginatedPostsResult, GetPostsFilters } from "./posts.repo";
import { Post } from "../../entities/Posts";
import { AppError } from "../../utils/app-error";

export class PostsService {
    private repo = new PostsRepo();

    async createPost(postData: { title: string; content: string; tags: string[]; category?: string | null; adminId: number }): Promise<Post> {
        let slug =
            postData.title.toLowerCase()
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

        const existingPost = await this.repo.findBySlug(slug);

        if (existingPost) {
            const randomSuffix = Math.random().toString(36).substring(2, 6);
            slug = `${slug}-${randomSuffix}`;
        }

        return this.repo.create({
            title: postData.title,
            content: postData.content,
            slug: slug,
            tags: postData.tags,
            category: postData.category || null,
            adminId: postData.adminId,
        });
    }

    async getAllPosts(filters: GetPostsFilters): Promise<PaginatedPostsResult> {
        return this.repo.getFilteredAndPaginated(filters);
    }

    async getPostBySlug(slug: string): Promise<Post | null> {
        return this.repo.findBySlug(slug);
    }

    async updatePost(
        slug: string,
        updatedData: { title?: string; content?: string; tags?: string[]; category?: string | null },
    ): Promise<Post | null> {
        const post = await this.repo.findBySlug(slug);
        if (!post) return null;

        if (updatedData.title !== undefined && updatedData.title !== post.title) {
            post.title = updatedData.title;

            let newSlug = updatedData.title.toLowerCase()
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            const conflictingPost = await this.repo.findBySlug(newSlug);

            if (conflictingPost && conflictingPost.id !== post.id) {
                const randomSuffix = Math.random().toString(36).substring(2, 6);
                newSlug = `${newSlug}-${randomSuffix}`;
            }

            post.slug = newSlug;
        }

        if (updatedData.content !== undefined) post.content = updatedData.content;
        if (updatedData.tags !== undefined) post.tags = updatedData.tags;
        if (updatedData.category !== undefined) post.category = updatedData.category || null;

        return this.repo.save(post);
    }

    async delete(slug: string): Promise<boolean> {
        const exists = await this.repo.findBySlug(slug);
        if (!exists) {
            throw new AppError(`Record with slug ${slug} not found`, 404);
        }
        return this.repo.delete(slug);
    }

    async getAllTags(): Promise<string[]> {
        return this.repo.getAllTags();
    }
}