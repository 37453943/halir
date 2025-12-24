import { z } from 'zod';
import { reqLogger } from './logger';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    ADMIN_EMAIL: z.string().email().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
});

export const env = (() => {
    try {
        const parsed = envSchema.parse(process.env as Record<string, any>);
        return parsed;
    } catch (e) {
        // Throw an explicit startup error so developers know their env is misconfigured
        reqLogger().error({ err: e }, 'Environment validation failed');
        // Fail fast so the process doesn't run with an invalid configuration
        throw new Error('Environment validation failed: ' + String(e));
    }
})();

export default env;
