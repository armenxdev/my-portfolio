import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';



let poolConfig: pg.PoolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 27363,
};

// SSL config for Aiven (or local if needed)
if (isProduction || process.env.DB_CA_PATH) {
    const caPath = process.env.DB_CA_PATH 
        ? path.resolve(process.cwd(), process.env.DB_CA_PATH) 
        : null;

    if (caPath && fs.existsSync(caPath)) {
        poolConfig.ssl = {
            ca: fs.readFileSync(caPath, 'utf8'),
            rejectUnauthorized: true,
        };
    } else if (isProduction) {
        // Fallback for production if certificate is required but not found
        poolConfig.ssl = {
            rejectUnauthorized: true,
        };
    }
}

let prisma: PrismaClient;

if (isProduction || process.env.USE_ADAPTER === 'true') {
    const pool = new pg.Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({
        adapter,
        log: isProduction ? ['error'] : ['query', 'info', 'warn', 'error'],
    });
} else {
    prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
}

export { prisma };