type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function getEnvLevel(): LogLevel {
    // Respect explicit public runtime config, otherwise default to debug in dev and error in prod
    const env = (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel)) || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'debug' : undefined);
    if (env) return env as LogLevel;
    return (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') ? 'error' : 'debug';
}

function shouldLog(level: LogLevel) {
    const current = getEnvLevel();
    return LEVELS[level] >= LEVELS[current];
}

function prefix(level: LogLevel) {
    return `[client:${level}]`;
}

const logger = {
    debug: (...args: any[]) => { if (shouldLog('debug')) console.debug(prefix('debug'), ...args); },
    info: (...args: any[]) => { if (shouldLog('info')) console.info(prefix('info'), ...args); },
    warn: (...args: any[]) => { if (shouldLog('warn')) console.warn(prefix('warn'), ...args); },
    error: (...args: any[]) => { if (shouldLog('error')) console.error(prefix('error'), ...args); },
};

export default logger;
