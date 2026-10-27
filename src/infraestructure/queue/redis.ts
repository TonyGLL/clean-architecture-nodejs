import IORedis from 'ioredis';
import { config } from '../config/env';

let connection: IORedis | null = null;

/** Redis is optional: without REDIS_URL the app falls back to in-process behaviour (inline emails, in-memory rate limit). */
export const isRedisEnabled = (): boolean => Boolean(config.REDIS_URL);

/** Rejects if `promise` does not settle in time. ioredis queues commands while disconnected, so the API must not wait on it forever. */
export const withTimeout = <T>(promise: Promise<T>, ms = 2000): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Redis operation timed out after ${ms}ms`)), ms);
        promise.then(
            value => { clearTimeout(timer); resolve(value); },
            error => { clearTimeout(timer); reject(error); },
        );
    });

/** Connection for the API (rate limiter, readiness probe, enqueueing jobs). Wrap calls in `withTimeout`. */
export const getRedis = (): IORedis => {
    if (!config.REDIS_URL) throw new Error('REDIS_URL is not configured');
    if (!connection) connection = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: 1 });
    return connection;
};

/** Connection for BullMQ workers: blocking commands must retry forever (`maxRetriesPerRequest: null`). */
export const createWorkerRedis = (): IORedis => {
    if (!config.REDIS_URL) throw new Error('REDIS_URL is not configured');
    return new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });
};

export const closeRedis = async (): Promise<void> => {
    if (connection) {
        await connection.quit();
        connection = null;
    }
};
