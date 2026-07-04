import { CookieOptions } from 'express';
import { REFRESH_TTL_SECONDS } from '../utils/jwt.helper';

export const REFRESH_COOKIE_CONFIG: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TTL_SECONDS * 1000,
    path: '/', // Changed to root path for broader accessibility
};