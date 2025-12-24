import pino from 'pino';

const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    redact: { paths: ['req.headers.authorization', 'password'], censor: '[REDACTED]' },
});

export function reqLogger(reqId?: string) {
    if (!reqId) return logger;
    return logger.child({ reqId });
}

