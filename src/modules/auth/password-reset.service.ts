import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { redisClient } from '../../config/redis';
import { AppError } from '../../utils/app-error';
import {sendOtpEmail, sendResetPasswordEmail} from './email.svc';
import { prisma } from '../../config/prisma';

export class PasswordResetService {
    private static readonly RESET_CODE_EXPIRY_MINUTES = 15;
    private static readonly MAX_ATTEMPTS = 5;

    private getResetCodeKey(email: string): string {
        return `password:reset:${email.toLowerCase().trim()}`;
    }

    private getAttemptsKey(email: string): string {
        return `password:reset_attempts:${email.toLowerCase().trim()}`;
    }

    async requestPasswordReset(email: string): Promise<void> {
        const normalizedEmail = email.toLowerCase().trim();

        const admin = await prisma.admin.findUnique({
            where: { email: normalizedEmail },
        });

        // Always return success to prevent email enumeration
        if (!admin) {
            // Still wait a bit to simulate processing (timing attack prevention)
            await new Promise(resolve => setTimeout(resolve, 100));
            return;
        }

        // Generate 6-digit reset code
        const resetCode = String(randomInt(100000, 999999));
        const hashedCode = await bcrypt.hash(resetCode, 12);

        // Store in Redis
        const resetKey = this.getResetCodeKey(normalizedEmail);
        await redisClient.setex(
            resetKey,
            PasswordResetService.RESET_CODE_EXPIRY_MINUTES * 60,
            hashedCode
        );

        // Send email (async, non-blocking)
        sendResetPasswordEmail(normalizedEmail, resetCode)
            .then(() => console.log(`📧 Password reset code sent to ${normalizedEmail}`))
            .catch((err) => console.error(`Failed to send reset code:`, err));
    }

    /**
     * Verify reset code and reset password
     */
    async resetPassword(
        email: string,
        resetCode: string,
        newPassword: string
    ): Promise<void> {
        const normalizedEmail = email.toLowerCase().trim();
        const resetKey = this.getResetCodeKey(normalizedEmail);

        // Check rate limiting
        await this.checkRateLimit(normalizedEmail);

        // Get stored hash
        const hashedCode = await redisClient.get(resetKey);
        if (!hashedCode) {
            throw new AppError('Reset code has expired or is invalid', 400);
        }

        // Verify code
        const isValid = await bcrypt.compare(resetCode, hashedCode);
        if (!isValid) {
            await this.recordFailedAttempt(normalizedEmail);
            throw new AppError('Invalid reset code', 400);
        }

        // Get admin
        const admin = await prisma.admin.findUnique({
            where: { email: normalizedEmail },
        });

        if (!admin) {
            throw new AppError('Admin not found', 404);
        }

        // Hash new password
        const newHashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.admin.update({
            where: { id: admin.id },
            data: { password_hash: newHashedPassword }
        });

        // Invalidate the reset code
        await redisClient.del(resetKey);

        // Invalidate all sessions for security
        await this.invalidateAllSessions(admin.id);
    }

    /**
     * Check rate limit for reset attempts
     */
    private async checkRateLimit(email: string): Promise<void> {
        const attemptsKey = this.getAttemptsKey(email);
        const attempts = await redisClient.get(attemptsKey);

        if (attempts && parseInt(attempts, 10) >= PasswordResetService.MAX_ATTEMPTS) {
            throw new AppError(
                'Too many failed reset attempts. Please request a new reset code.',
                429
            );
        }
    }

    /**
     * Record failed reset attempt
     */
    private async recordFailedAttempt(email: string): Promise<void> {
        const attemptsKey = this.getAttemptsKey(email);
        await redisClient.incr(attemptsKey);
        await redisClient.expire(attemptsKey, 60 * 60); // 1 hour TTL
    }

    /**
     * Invalidate all sessions for a user
     */
    private async invalidateAllSessions(adminId: number): Promise<void> {
        const pattern = `admin:session:*`;
        const keys = await redisClient.keys(pattern);

        for (const key of keys) {
            const sessionData = await redisClient.get(key);
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    if (session.adminId === String(adminId)) {
                        await redisClient.del(key);
                    }
                } catch {
                    // Skip invalid sessions
                }
            }
        }
    }

    /**
     * Verify reset code without resetting (for multi-step flow)
     */
    async verifyResetCode(email: string, resetCode: string): Promise<boolean> {
        const normalizedEmail = email.toLowerCase().trim();
        const resetKey = this.getResetCodeKey(normalizedEmail);

        const hashedCode = await redisClient.get(resetKey);
        if (!hashedCode) return false;

        return await bcrypt.compare(resetCode, hashedCode);
    }
}

export default PasswordResetService;
