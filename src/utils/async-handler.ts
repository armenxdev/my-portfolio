import { Request, Response, NextFunction, RequestHandler } from 'express';

// Define a type for our async controller function that mirrors Express but enforces generics
export type AsyncRequestHandler<
    P = any,             // Route params (e.g., /user/:id)
    ResBody = any,       // Response body type
    ReqBody = any,       // Request body type
    ReqQuery = any       // Query strings (e.g., ?page=1)
> = (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
) => Promise<any>;

/**
 * Advanced Async Handler to catch unhandled promise rejections
 * and automatically pass them to the Express error-handling middleware.
 */
export const asyncHandler = <P, ResBody, ReqBody, ReqQuery>(
    handler: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};