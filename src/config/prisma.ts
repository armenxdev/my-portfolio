import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ 
    user: 'armen_developer',
    host: 'localhost',
    database: 'portfolio_db',
    password: 'Armen2008',
    port: 5432,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

export { pool };
