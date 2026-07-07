import { ContactRepo, PaginatedMessagesResult, GetMessagesFilters } from "./contact.repo";
import { ContactMessage } from "@prisma/client";
import { AppError } from "../../utils/app-error";

export class ContactService {
    private repo = new ContactRepo();

    async createMessage(data: {
        firstname: string;
        lastname: string;
        email: string;
        message: string;
    }): Promise<ContactMessage> {
        return this.repo.create({
            firstname: data.firstname.trim(),
            lastname: data.lastname.trim(),
            email: data.email.toLowerCase().trim(),
            message: data.message.trim(),
        });
    }

    async getAllMessages(filters: GetMessagesFilters): Promise<PaginatedMessagesResult> {
        return this.repo.getPaginated(filters);
    }

    async getMessageById(id: number): Promise<ContactMessage> {
        const message = await this.repo.findById(id);
        if (!message) {
            throw new AppError('Message not found', 404);
        }
        return message;
    }

    async deleteMessage(id: number): Promise<boolean> {
        const message = await this.repo.findById(id);
        if (!message) {
            throw new AppError('Message not found', 404);
        }
        return this.repo.delete(id);
    }
}