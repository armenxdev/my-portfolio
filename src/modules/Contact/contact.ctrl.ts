import { Request, Response } from "express";
import { ContactService } from "./contact.svc";
import { asyncHandler } from "../../utils/async-handler";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/app-error";

const contactService = new ContactService();

export const createMessage = asyncHandler(async (req: Request, res: Response) => {
    const { firstname, lastname, email, message } = req.body;

    const newMessage = await contactService.createMessage({
        firstname,
        lastname,
        email,
        message,
    });

    res.status(201).json({
        success: true,
        data: newMessage,
        message: 'Your message has been sent successfully!',
    });
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = req.query.page as string | undefined;
    const limit = req.query.limit as string | undefined;
    const sort = req.query.sort as string | undefined;

    const parsedPage = parseInt(page || '1', 10) || 1;
    const parsedLimit = parseInt(limit || '10', 10) || 10;
    const sortOrder = sort === 'oldest' ? 'oldest' : 'latest';

    const { messages, meta } = await contactService.getAllMessages({
        page: parsedPage,
        limit: parsedLimit,
        sort: sortOrder,
    });

    res.status(200).json({
        success: true,
        data: messages,
        meta,
    });
});

export const getMessageById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
        throw new AppError('Invalid message ID', 400);
    }

    const message = await contactService.getMessageById(id);

    res.status(200).json({
        success: true,
        data: message,
    });
});

export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
        throw new AppError('Invalid message ID', 400);
    }

    await contactService.deleteMessage(id);

    res.status(200).json({
        success: true,
        data: null,
        message: 'Message deleted successfully',
    });
});