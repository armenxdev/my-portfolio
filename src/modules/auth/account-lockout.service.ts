import { redisClient } from '../../config/redis';
import { AppError } from '../../utils/app-error';

export class AccountLockoutService {
    private static readonly MAX_ATTEMPTS = 5;
    private static readonly LOCKOUT_DURATION_MINUTES = 15;
    private static readonly ATTEMPT_TTL_MINUTES = 30;

    private getLockoutKey(adminId: number): string {
        return `admin:lockout:${adminId}`;
    }

    private getAttemptsKey(adminId: number): string {
        return `admin:login_attempts:${adminId}`;
    }

    async isLocked(adminId: number): Promise<boolean> {
        const lockoutKey = this.getLockoutKey(adminId);
        const isLocked = await redisClient.get(lockoutKey);
        return !!isLocked;
    }


    async recordFailedAttempt(adminId: number): Promise<void> {
        const attemptsKey = this.getAttemptsKey(adminId);
        const lockoutKey = this.getLockoutKey(adminId);

        const attempts = await redisClient.incr(attemptsKey);

        if (attempts === 1) {
            await redisClient.expire(attemptsKey, AccountLockoutService.ATTEMPT_TTL_MINUTES * 60);
        }

        // Lock account if max attempts exceeded
        if (attempts >= AccountLockoutService.MAX_ATTEMPTS) {
            await redisClient.setex(
                lockoutKey,
                AccountLockoutService.LOCKOUT_DURATION_MINUTES * 60,
                'locked'
            );
            // Clear attempts counter
            await redisClient.del(attemptsKey);
        }
    }

    async resetAttempts(adminId: number): Promise<void> {
        const attemptsKey = this.getAttemptsKey(adminId);
        const lockoutKey = this.getLockoutKey(adminId);

        await Promise.all([
            redisClient.del(attemptsKey),
            redisClient.del(lockoutKey),
        ]);
    }

    async getLockoutRemainingTime(adminId: number): Promise<number> {
        const lockoutKey = this.getLockoutKey(adminId);
        const ttl = await redisClient.ttl(lockoutKey);
        return ttl > 0 ? ttl : 0;
    }

    async getFailedAttemptsCount(adminId: number): Promise<number> {
        const attemptsKey = this.getAttemptsKey(adminId);
        const attempts = await redisClient.get(attemptsKey);
        return attempts ? parseInt(attempts, 10) : 0;
    }

    /**
     * Check and throw error if account is locked
     */
    async checkAndThrowIfLocked(adminId: number): Promise<void> {
        const isLocked = await this.isLocked(adminId);
        if (isLocked) {
            const remainingTime = await this.getLockoutRemainingTime(adminId);
            const minutes = Math.ceil(remainingTime / 60);
            throw new AppError(
                `Account is locked due to too many failed login attempts. Try again in ${minutes} minute(s).`,
                423
            );
        }
    }
}

export default AccountLockoutService;
