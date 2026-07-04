import jwt from 'jsonwebtoken';
import 'dotenv/config';

// 1. Ստուգում ենք՝ արդյոք .env-ում գաղտնաբառերը գրված են, թե ոչ
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error("❌ JWT secrets are not defined in environmental variables!");
}

// 2. Ժամկետների սահմանում (տեքստային Access-ի համար, վայրկյաններով՝ Refresh-ի)
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
export const REFRESH_TTL_SECONDS = parseInt(process.env.JWT_REFRESH_EXPIRES_SECONDS || '604800', 10);

// 3. TypeScript Interface-ներ JWT Payload-ի համար
export interface AccessTokenPayload {
    sub: number; // adminId
    jti: string; // refreshJti (սեսիայի UUID-ն)
}

export interface RefreshTokenPayload {
    sub: number; // adminId
    jti: string; // սեսիայի UUID-ն
}

/**
 * Գեներացնում է կարճաժամկետ Access Token (15 րոպե)
 * Իր մեջ պահում է adminId-ն և սեսիայի jti-ն
 */
export const generateAccessToken = (adminId: number, refreshJti: string): string => {
    const payload: AccessTokenPayload = {
        sub: adminId,
        jti: refreshJti
    };

    return jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES as jwt.SignOptions['expiresIn']
    });
};

/**
 * Գեներացնում է երկարաժամկետ Refresh Token (7 օր)
 */
export const generateRefreshToken = (adminId: number, jti: string): string => {
    const payload: RefreshTokenPayload = {
        sub: adminId,
        jti
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TTL_SECONDS // Ընդունում է թիվ (վայրկյաններ)
    });
};

/**
 * Վավերացնում է Access Token-ի ստորագրությունը և վերադարձնում տվյալները
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
    return jwt.verify(token, JWT_ACCESS_SECRET) as unknown as AccessTokenPayload;
};

/**
 * Վավերացնում է Refresh Token-ի ստորագրությունը և վերադարձնում տվյալները
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    return jwt.verify(token, JWT_REFRESH_SECRET) as unknown as RefreshTokenPayload;
};