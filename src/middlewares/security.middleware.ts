import type { Request, Response, NextFunction } from 'express';

/**
 * CORS Configuration Middleware
 * 
 * Configure allowed origins, methods, headers, and credentials.
 * In production, replace '*' with your actual frontend domain.
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const origin = req.headers.origin;

    // Set CORS headers
    if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || !process.env.ALLOWED_ORIGINS)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!origin && allowedOrigins.includes('*')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
};

/**
 * Request Size Limit Middleware
 * Prevents large payload attacks by limiting request body size
 */

const parseSizeToBytes = (sizeStr: string): number => {
    const numeric = parseInt(sizeStr, 10);
    if (sizeStr.toLowerCase().includes('kb')) return numeric * 1024;
    if (sizeStr.toLowerCase().includes('mb')) return numeric * 1024 * 1024;
    return numeric; // Եթե ուղղակի թիվ է գրված (բայթերով)
};

export const requestSizeLimiter = (maxSize: string = '10kb') => {
    // 🎯 1. Փոխարկում ենք 10kb -> 10240 bytes մեկ անգամ՝ middleware-ը ստեղծելիս
    const maxSizeInBytes = parseSizeToBytes(maxSize);

    return (req: Request, res: Response, next: NextFunction) => {
        let length = 0;

        if (req.headers['content-length']) {
            length = parseInt(req.headers['content-length'], 10);
        }

        // 🎯 2. Եթե Content-Length-ը չկա, նոր միայն ստիպված լսում ենք stream-ի chunk-երը
        if (isNaN(length) || !req.headers['content-length']) {
            let currentLength = 0;

            req.on('data', (chunk) => {
                currentLength += chunk.length;
                if (currentLength > maxSizeInBytes) {
                    res.status(413).json({
                        success: false,
                        message: `Request body too large. Maximum size is ${maxSize}.`,
                    });
                    req.destroy();
                }
            });

            req.on('end', () => {
                next();
            });
        }
        // 🎯 3. Եթե Content-Length-ը կա (սովորական հարցումների 99%-ը), ուղղակի համեմատում ենք header-ը
        else if (length > maxSizeInBytes) {
            res.status(413).json({
                success: false,
                message: `Request body too large. Maximum size is ${maxSize}.`,
            });
            req.destroy();
        } else {
            // ✅ Ամեն ինչ նորմալ է, անցնում ենք առաջ՝ ԱՌԱՆՑ stream-ը կարդալու
            next();
        }
    };
};