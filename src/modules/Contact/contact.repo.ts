import { prisma } from "../../config/prisma";
import { ContactMessage } from "@prisma/client";

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
    async create(data: any): Promise<ContactMessage> {
        return prisma.contactMessage.create({
            data: {
                firstname: data.firstname,
                lastname: data.lastname,
                email: data.email,
                message: data.message,
            }
        });
    }

    async getPaginated(filters: GetMessagesFilters): Promise<PaginatedMessagesResult> {
        const { page, limit, sort } = filters;
        const skip = (page - 1) * limit;
        const orderBy = sort === 'oldest' ? 'asc' : 'desc';

        const [messages, totalCount] = await Promise.all([
            prisma.contactMessage.findMany({
                skip,
                take: limit,
                orderBy: {
                    created_at: orderBy,
                },
            }),
            prisma.contactMessage.count(),
        ]);

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
        return prisma.contactMessage.findUnique({
            where: { id },
        });
    }

    async delete(id: number): Promise<boolean> {
        const result = await prisma.contactMessage.delete({
            where: { id },
        });
        return !!result;
    }
}