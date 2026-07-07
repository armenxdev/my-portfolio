import type {Request, Response} from 'express';
import bcrypt from 'bcryptjs';
import {v4 as uuidv4} from 'uuid';
import {prisma} from '../../config/prisma';
import {REFRESH_COOKIE_CONFIG} from '../../config/cookie';
import {asyncHandler} from "../../utils/async-handler";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from '../../utils/jwt.helper';
import {AppError} from "../../utils/app-error";
import OtpService from "./otp.service";
import SessionService from "./session.svc";
import {sendOtpEmail} from "./email.svc";
import {AccountLockoutService} from "./account-lockout.service";
import {DeviceFingerprintService} from "./device-fingerprint.service";
import {logger} from "../../utils/logger";


const otpService = new OtpService();
const sessionService = new SessionService();
const accountLockoutService = new AccountLockoutService();
const deviceFingerprintService = new DeviceFingerprintService();


export const login = asyncHandler(async (req: Request, res: Response) => {
    const {email, password} = req.body;

    const admin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase().trim() }
    });

    if (!admin) {
        // Still wait to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 100));
        throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    await accountLockoutService.checkAndThrowIfLocked(admin.id);

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
        await accountLockoutService.recordFailedAttempt(admin.id);
        const remainingAttempts = 5 - await accountLockoutService.getFailedAttemptsCount(admin.id);
        logger.warn(`Failed login attempt for ${admin.email}. Remaining: ${remainingAttempts}`);
        throw new AppError('Invalid email or password', 401);
    }


    // Reset lockout on successful login
    await accountLockoutService.resetAttempts(admin.id);

    // Generate OTP for email verification
    const otpCode = await otpService.createAndSaveOtp(admin.id);

    // 📧 Send OTP email asynchronously (non-blocking)
    sendOtpEmail(admin.email, otpCode)
        .catch((err) => logger.error(`Failed to send OTP to ${admin.email}:`, err));

    // Return immediately without waiting for email
    res.status(200).json({
        success: true,
        message: 'Verification code sent to email.',
    });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const admin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase().trim() }
    });



    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    if (!otp) {
        throw new AppError('Verification code is required', 400);
    }
    await otpService.verifyAndConsumeOtp(admin.id, otp);

    const deviceInfo = deviceFingerprintService.getDeviceInfo(req);

    const jti = uuidv4();
    await sessionService.createSession(admin.id, jti, deviceInfo);

    const accessToken = generateAccessToken(admin.id, jti);
    const refreshToken = generateRefreshToken(admin.id, jti);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_CONFIG);

    logger.info(`Login successful for ${admin.email} from ${deviceInfo.ip} (${deviceFingerprintService.getDeviceDescription(deviceInfo.userAgent)})`);

    res.status(200).json({
        success: true,
        accessToken,
        device: {
            fingerprint: deviceInfo.fingerprint,
            description: deviceFingerprintService.getDeviceDescription(deviceInfo.userAgent),
        },
    });
});


export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        throw new AppError('Refresh token missing', 401);
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new AppError('Invalid refresh token', 401);
    }

    const oldJti = decoded.jti;
    const adminId = decoded.sub;

    const newJti = uuidv4();

    const { isValid, isReuseAttack, activeJti } = await sessionService.updateSessionAndDetectReuse(oldJti, newJti);

    if (isReuseAttack) {
        logger.error(`🚨 SECURITY ALERT: Refresh token reuse detected for admin ${adminId}. All sessions invalidated.`);
        throw new AppError('Security alert: Suspicious activity detected. Please login again.', 401);
    }

    if (!isValid) {
        throw new AppError('Session expired or invalidated', 401);
    }

    const admin = await prisma.admin.findUnique({
        where: { id: adminId }
    });

    if (!admin) {
        throw new AppError('Admin no longer exists', 401);
    }

    // ============================================
    // 🌟 ՈՒՇԱԴՐՈՒԹՅՈՒՆ: Օգտագործում ենք activeJti-ն newJti-ի փոխարեն
    const newAccessToken = generateAccessToken(adminId, activeJti);
    const newRefreshToken = generateRefreshToken(adminId, activeJti);

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_CONFIG);

    res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        tokenRotated: true,
        user: {
            id: admin.id,
            email: admin.email
        }
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const {refreshToken} = req.cookies;

    if (refreshToken) {
        try {
            const decoded = verifyRefreshToken(refreshToken);
            await sessionService.invalidateSession(decoded.jti);
            logger.info(`Logout successful for session ${decoded.jti}`);
        } catch (e) {
        }
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
});


export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const {email} = req.body;
    const passwordResetService = new (await import('./password-reset.service')).default();

    await passwordResetService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
    });
});


export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const {email, resetCode, newPassword} = req.body;
    const passwordResetService = new (await import('./password-reset.service')).default();

    await passwordResetService.resetPassword(email, resetCode, newPassword);

    res.status(200).json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.',
    });
});

