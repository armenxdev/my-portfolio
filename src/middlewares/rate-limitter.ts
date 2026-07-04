import rateLimit from 'express-rate-limit';
import {AppError} from "../utils/app-error";

// Սահմանափակում /login endpoint-ի համար (օրինակ՝ 1 ժամում առավելագույնը 15 փորձ քո հին պրոյեկտի պես)
export const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ժամ
    max: 26, // Առավելագույնը 15 հարցում նույն IP-ից
    handler: (req, res, next) => {
        next(new AppError('Too many login attempts from this IP. Try again later.', 429));
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Սահմանափակում /verify-otp endpoint-ի համար
export const otpLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 րոպե (քանի դեռ OTP-ն ակտիվ է)
    max: 5, // Մաքսիմալ 5 փորձ
    handler: (req, res, next) => {
        next(new AppError('Too many OTP verification attempts. Request a new code.', 429));
    },
    standardHeaders: true,
    legacyHeaders: false,
});