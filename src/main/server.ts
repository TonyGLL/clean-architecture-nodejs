import 'reflect-metadata';
import app from './app';
import pool from '../infraestructure/database/postgres/config';
import { productsJob } from '../cron/products';
import { config } from '../infraestructure/config/env';
import { logger } from '../infraestructure/config/winston';

const PORT = config.PORT;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down server...`);
    server.close(async () => {
        productsJob.stop();
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
