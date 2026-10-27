import { CronJob } from 'cron';
import { container } from '../infraestructure/ioc/config';
import { config } from '../infraestructure/config/env';
import { logger } from '../infraestructure/config/winston';
import { ExpirePendingOrdersUseCase } from '../application/use-cases/order.use-case';
import { withAdvisoryLock } from './advisory-lock';

const ORDERS_EXPIRY_LOCK_ID = 727002;

/** Cancels unpaid orders past the reservation window and returns their stock. */
export const runOrdersExpiry = (): Promise<void> =>
    withAdvisoryLock(ORDERS_EXPIRY_LOCK_ID, 'Order expiry', async () => {
        const useCase = container.get(ExpirePendingOrdersUseCase);
        const { cancelled, skipped, failed } = await useCase.execute(config.ORDER_RESERVATION_MINUTES);
        if (cancelled || skipped || failed) logger.info('Order expiry finished', { cancelled, skipped, failed });
    });

// Every 5 minutes
export const ordersExpiryJob = new CronJob(
    '*/5 * * * *',
    async () => {
        try {
            await runOrdersExpiry();
        } catch (error) {
            logger.error('Order expiry run failed', { error });
        }
    },
    null,
    false,
);
