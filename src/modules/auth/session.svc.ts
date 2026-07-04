import {redisClient} from "../../config/redis";
import {AppError} from "../../utils/app-error";

class SessionService {
    private static SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

    async createSession(adminId: number, jti: string, deviceInfo?: any): Promise<void> {
        const sessionKey = `admin:session:${jti}`;

        const sessionValue = JSON.stringify({
            adminId,
            deviceInfo,
            createdAt: new Date().toISOString()
        });

        await redisClient.setex(sessionKey, SessionService.SESSION_TTL_SECONDS, sessionValue);
    }

    async updateSessionAndDetectReuse(oldJti: string, newJti: string): Promise<{ isValid: boolean; isReuseAttack: boolean; activeJti: string }> {
        const oldKey = `admin:session:${oldJti}`;
        const newKey = `admin:session:${newJti}`;

        const sessionData = await redisClient.get(oldKey);

        if (!sessionData) {
            const alreadyRefreshed = await redisClient.get(newKey);
            if (alreadyRefreshed) {
                return { isValid: true, isReuseAttack: false, activeJti: newJti };
            }
            return { isValid: false, isReuseAttack: false, activeJti: oldJti };
        }

        const parsed = JSON.parse(sessionData);

        // --- GRACE PERIOD LOGIC ---
        if (parsed.isRotated) {
            // 🌟 ԿԱՐԵՎՈՐ: Վերադարձնում ենք այն newJti-ն, որը իրականում ստեղծվել է առաջին հարցման ժամանակ
            return { isValid: true, isReuseAttack: false, activeJti: parsed.replacedByJti };
        }

        // 1. Ստեղծում ենք ՆՈՐ սեսիան (Առաջին հարցման համար)
        await redisClient.setex(newKey, SessionService.SESSION_TTL_SECONDS, JSON.stringify({
            ...parsed,
            updatedAt: new Date().toISOString()
        }));

        // 2. ՀԻՆ սեսիան նշում ենք որպես rotated ու պահում ենք, թե ումով է փոխարինվել (replacedByJti)
        const gracePeriodSession = {
            ...parsed,
            isRotated: true,
            rotatedAt: new Date().toISOString(),
            replacedByJti: newJti // 💾 Սա պահում ենք, որ երկրորդ հարցմանը հետ տանք
        };

        await redisClient.setex(oldKey, 5, JSON.stringify(gracePeriodSession));

        return { isValid: true, isReuseAttack: false, activeJti: newJti };
    }

    async invalidateSession(jti: string): Promise<void> {
        if (!jti) return;

        const sessionKey = `admin:session:${jti}`;
        await redisClient.del(sessionKey);
    }

    async isValidSession(jti: string): Promise<boolean> {
        if (!jti) return false;

        const sessionKey = `admin:session:${jti}`;

        const session = await redisClient.get(sessionKey);

        return !!session;
    }
}

export default SessionService