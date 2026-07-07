import express from 'express';
import { logger } from './utils/logger';
import cookieParser from 'cookie-parser';
import { morganMiddleware } from './middlewares/morgan.middleware';
import { globalErrorHandler } from './middlewares/error.middleware';
import { prisma } from './config/prisma';
import './config/redis'
import router from "./routes";
import helmet from "helmet";
import cors from "cors";
import { requestSizeLimiter } from './middlewares/security.middleware';

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(requestSizeLimiter('10kb')); // Limit request body size
app.use(cookieParser())
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

app.use(morganMiddleware);

app.use('/api', router)


app.use(globalErrorHandler);

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {

        await prisma.$connect();
        logger.info("📦 Database connection successfully established via Prisma!");

        logger.info("⚡ Redis connection successfully established!");


        app.listen(PORT, () => {
            logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });

    } catch (error) {
        logger.error("💥 Error during infrastructure initialization:", error);
        process.exit(1);
    }
}

startServer();