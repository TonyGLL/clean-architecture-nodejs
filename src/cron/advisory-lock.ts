import { Pool } from 'pg';
import { container } from '../infraestructure/ioc/config';
import { INFRASTRUCTURE_TYPES } from '../infraestructure/ioc/types';
import { logger } from '../infraestructure/config/winston';

/**
 * Runs `job` only if no other process holds the Postgres advisory lock `lockId`,
 * so scheduled jobs stay single-instance even with several worker replicas.
 */
export const withAdvisoryLock = async (lockId: number, jobName: string, job: () => Promise<void>): Promise<void> => {
    const pool = container.get<Pool>(INFRASTRUCTURE_TYPES.PostgresPool);
    const lockClient = await pool.connect();
    try {
        const { rows } = await lockClient.query('SELECT pg_try_advisory_lock($1) AS locked', [lockId]);
        if (!rows[0].locked) {
            logger.info(`${jobName} already running in another worker, skipping`);
            return;
        }
        try {
            await job();
        } finally {
            await lockClient.query('SELECT pg_advisory_unlock($1)', [lockId]);
        }
    } finally {
        lockClient.release();
    }
};
