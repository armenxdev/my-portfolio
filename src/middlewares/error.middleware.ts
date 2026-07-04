import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

export const globalErrorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // 1. Check if the error is a trusted Operational Error (AppError)
    if (err instanceof AppError) {
        // Operational errors mean predictable failures (e.g., 400 Bad Request, 404 Not Found)
        logger.warn(`[${req.method}] ${req.originalUrl} - ${err.statusCode} ${err.message}`);

        res.status(err.statusCode).json({
            status: err.statusCode >= 500 ? 'error' : 'fail',
            message: err.message,
            details: err.details ?? undefined,
            ...(isDevelopment && { stack: err.stack }),
        });
        return;
    }

    // 2. Catch native database/library errors and transform them if necessary
    // Example: MongoDB validation errors or CastErrors can be caught here
    if (err.name === 'ValidationError') {
        logger.warn(`Validation Error at ${req.originalUrl}: ${err.message}`);
        res.status(400).json({ status: 'fail', message: err.message });
        return;
    }

    // 3. Handle Programmer/System Errors (Unhandled Bugs, DB Crash, Syntax Errors)
    // These represent severe, unexpected internal failures
    logger.error(`💥 Unhandled Exception at [${req.method}] ${req.originalUrl}: ${err.message}`, {
        stack: err.stack,
    });

    res.status(500).json({
        status: 'error',
        message: isDevelopment ? err.message : 'Something went very wrong!',
        ...(isDevelopment && { stack: err.stack }),
    });
};
