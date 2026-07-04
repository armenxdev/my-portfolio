import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { verifyAccessToken } from '../utils/jwt.helper';
import { redisClient } from '../config/redis';
import { AppDataSource } from '../config/data-source';

/**
 * Extended Request interface with authenticated user
 */
export interface AuthRequest extends Request {
    admin?: {
        id: number;
        email: string;
    };
}

/**
 * Authentication Middleware
 * 
 * This middleware:
 * 1. Extracts JWT from 'Authorization: Bearer <token>' header
 * 2. Verifies the token signature and expiration
 * 3. Checks if the session is still valid in Redis
 * 4. Checks if the admin still exists in the database
 * 5. Attaches the admin object to the request
 * 
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // 1. Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('Access token is required', 401);
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new AppError('Invalid authorization header format. Use: Bearer <token>', 401);
        }

        const token = parts[1];

        if (!token || token.trim() === '') {
            throw new AppError('Access token is required', 401);
        }

        let decoded: { sub: number; jti: string };
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            if (error instanceof Error && error.name === 'TokenExpiredError') {
                throw new AppError('Access token has expired', 401);
            }
            if (error instanceof Error && error.name === 'JsonWebTokenError') {
                throw new AppError('Invalid access token', 401);
            }
            throw new AppError('Invalid access token', 401);
        }

        const { sub: adminId, jti } = decoded;

        if (!adminId || !jti) {
            throw new AppError('Invalid token payload', 401);
        }

        const sessionKey = `admin:session:${jti}`;
        const sessionData = await redisClient.get(sessionKey);

        if (!sessionData) {
            throw new AppError('Session expired or invalidated. Please login again', 401);
        }

        const adminRepository = AppDataSource.getRepository('Admin');
        const admin = await adminRepository.findOne({
            where: { id: adminId },
            select: { id: true, email: true },
        });

        if (!admin) {
            await redisClient.del(sessionKey);
            throw new AppError('Admin account no longer exists', 401);
        }

        req.admin = {
            id: admin.id,
            email: admin.email,
        };

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional Authentication Middleware
 * 
 * Similar to authenticate, but doesn't throw errors if token is missing/invalid.
 * Useful for routes that behave differently for authenticated vs unauthenticated users.
 * 
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const optionalAuthenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return next();
        }

        const token = parts[1];

        if (!token) {
            return next();
        }

        const decoded = verifyAccessToken(token);
        const { sub: adminId, jti } = decoded;

        const sessionKey = `admin:session:${jti}`;
        const sessionData = await redisClient.get(sessionKey);

        if (!sessionData) {
            return next();
        }

        const adminRepository = AppDataSource.getRepository('Admin');
        const admin = await adminRepository.findOne({
            where: { id: adminId },
            select: { id: true, email: true },
        });

        if (admin) {
            req.admin = {
                id: admin.id,
                email: admin.email,
            };
        }

        next();
    } catch (error) {
        // Silently continue without authentication
        next();
    }
};

/**
 * Role-based Authorization Middleware
 * 
 * Use this after authenticate middleware to check for specific roles.
 * Note: Currently only supports admin role. Can be extended for multi-role systems.
 * 
 * @param allowedRoles - Array of allowed roles
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.admin) {
            return next(new AppError('Authentication required', 401));
        }

        // For now, we only have admin role
        // This can be extended when you add role field to Admin entity
        const hasPermission = allowedRoles.includes('admin');

        if (!hasPermission) {
            return next(new AppError('You do not have permission to access this resource', 403));
        }

        next();
    };
};
