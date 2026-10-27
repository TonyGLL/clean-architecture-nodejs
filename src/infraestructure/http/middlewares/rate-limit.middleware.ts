import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis, isRedisEnabled, withTimeout } from '../../queue/redis';
import { HttpStatusCode } from '../../../domain/shared/http.status';

/**
 * Brute-force protection for unauthenticated auth endpoints (login, register, password reset).
 * Uses a Redis store when REDIS_URL is set (limits shared across replicas), otherwise per-instance memory.
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    ...(isRedisEnabled() && {
        store: new RedisStore({ sendCommand: (command: string, ...args: string[]) => withTimeout(getRedis().call(command, ...args)) as Promise<any> }),
    }),
    passOnStoreError: true, // fail open if Redis is unavailable rather than blocking logins
    statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
});
