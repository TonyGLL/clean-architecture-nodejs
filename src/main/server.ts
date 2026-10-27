import 'reflect-metadata';
import app from './app';
import pool from '../infraestructure/database/postgres/config';
import { config } from '../infraestructure/config/env';
import { closeMailQueue } from '../infraestructure/queue/mail.queue';
import { closeRedis, isRedisEnabled } from '../infraestructure/queue/redis';
import { logger } from '../infraestructure/config/winston';

const PORT = config.PORT;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down server...`);
    server.close(async () => {
        if (isRedisEnabled()) await closeMailQueue();
        await closeRedis();
        await pool.end();
        logger.info('Server off.');
        process.exit(0);
    });
    // Force exit if connections do not drain in time
    setTimeout(() => process.exit(1), 10_000).unref();
};

// Docker/Kubernetes/ECS send SIGTERM; SIGINT covers Ctrl+C in dev
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
