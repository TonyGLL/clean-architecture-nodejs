import { rateLimit } from 'express-rate-limit';
import { HttpStatusCode } from '../../../domain/shared/http.status';

/**
 * Brute-force protection for unauthenticated auth endpoints (login, register, password reset).
 * In-memory store: limits are per app instance. Move to a shared store (e.g. Redis) when scaling horizontally.
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
});
