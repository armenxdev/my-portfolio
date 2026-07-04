import morgan from 'morgan';
import type { StreamOptions } from 'morgan';
import { logger } from '../utils/logger';

// Link Morgan logging stream to Winston's http level
const stream: StreamOptions = {
    write: (message) => logger.http(message.trim()),
};

// Skip HTTP logging if we are running tests
const skip = (): boolean => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'test';
};

// Build the middleware
export const morganMiddleware = morgan(
    ':remote-addr :method :url :status :res[content-length] - :response-time ms',
    { stream, skip }
);
