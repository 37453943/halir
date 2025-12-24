import * as Sentry from '@sentry/node';
import { env } from './env';

export function initSentry() {
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    Sentry.init({ dsn, environment: env.NODE_ENV });
}

export default Sentry;