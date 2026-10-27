import 'reflect-metadata';
import { productsJob } from '../cron/products';
import pool from '../infraestructure/database/postgres/config';
import { isRedisEnabled, closeRedis } from '../infraestructure/queue/redis';
import { startMailWorker } from '../infraestructure/queue/mail.worker';
import { logger } from '../infraestructure/config/winston';

// Background process: scheduled jobs (and queue consumers) live here so API replicas stay stateless.
productsJob.start();
const mailWorker = isRedisEnabled() ? startMailWorker() : null;
if (!mailWorker) logger.warn('REDIS_URL not set: mail queue consumer disabled (emails are sent inline by the API)');
logger.info('Worker started');

const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Stopping worker...`);
    productsJob.stop();
    await mailWorker?.close();
    await closeRedis();
    await pool.end();
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
