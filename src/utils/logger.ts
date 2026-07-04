import winston from 'winston';

// Define log severity levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for console output
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Determine the log level based on environment
const level = (): string => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'info';
};

// Custom development format (human-readable)
const developmentFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
    )
);

// Custom production format (structured JSON)
const productionFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Choose format dynamically
const format = process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat;

// Define where to send logs
const transports = [
    // Always log to the console
    new winston.transports.Console(),

    // In production, you can also log critical errors to a file
    ...(process.env.NODE_ENV === 'production'
        ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })]
        : [])
];

export const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});
