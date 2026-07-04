import { AppDataSource } from "../../config/data-source";
import { ContactMessage } from "../../entities/ContactMessage";

export interface ContactPaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedMessagesResult {
    messages: ContactMessage[];
    meta: ContactPaginationMeta;
}

export interface GetMessagesFilters {
    page: number;
    limit: number;
    sort: 'latest' | 'oldest';
}

export class ContactRepo {
    private repo = AppDataSource.getRepository(ContactMessage);

    async create(data: Partial<ContactMessage>): Promise<ContactMessage> {
        const newMessage = this.repo.create(data);
        return this.repo.save(newMessage);
    }

    async getPaginated(filters: GetMessagesFilters): Promise<PaginatedMessagesResult> {
        const { page, limit, sort } = filters;
        const queryBuilder = this.repo.createQueryBuilder('msg');

        const orderDirection = sort === 'oldest' ? 'ASC' : 'DESC';
        queryBuilder.orderBy('msg.created_at', orderDirection);

        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        const [messages, totalCount] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(totalCount / limit);

        return {
            messages,
            meta: {
                total: totalCount,
                page,
                limit,
                totalPages,
            },
        };
    }

    async findById(id: number): Promise<ContactMessage | null> {
        return this.repo.findOneBy({ id });
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repo.delete({ id });
        return (result.affected ?? 0) > 0;
    }
}