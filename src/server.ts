import express from 'express';
import { logger } from './utils/logger';
import cookieParser from 'cookie-parser';
import { morganMiddleware } from './middlewares/morgan.middleware';
import { globalErrorHandler } from './middlewares/error.middleware';
import { AppDataSource } from "./config/data-source";
import './config/redis'
import router from "./routes";
import helmet from "helmet";
import { corsMiddleware, requestSizeLimiter } from './middlewares/security.middleware';

const app = express();

app.use(helmet())
app.use(corsMiddleware);
app.use(requestSizeLimiter('10kb')); // Limit request body size
app.use(cookieParser())
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

app.use(morganMiddleware);

app.use('/api', router)


app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {

        await AppDataSource.initialize();
        logger.info("📦 Database connection successfully established!");

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