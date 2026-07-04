import { Redis } from 'ioredis';
import 'dotenv/config';

// Վերցնում ենք Redis-ի URL-ը env-ից, կամ դնում ենք local default-ը
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Ստեղծում ենք Redis Client-ի օբյեկտը
export const redisClient = new Redis(REDIS_URL, {
    // Լրացուցիչ Production կոնֆիգներ
    maxRetriesPerRequest: 3, // Եթե միացումը կորի, առավելագույնը 3 անգամ կփորձի վերամիանալ
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true; // Եթե read-only սխալ տա, ավտոմատ կվերամիանա
        }
        return false;
    }
});

