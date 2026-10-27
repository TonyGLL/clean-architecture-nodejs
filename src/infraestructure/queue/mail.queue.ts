import { Queue } from 'bullmq';
import { getRedis } from './redis';

export const MAIL_QUEUE = 'mail';

export type MailJob =
    | { name: 'restore-password'; data: { email: string; token: string } }
    | { name: 'password-changed'; data: { email: string } };

let queue: Queue | null = null;

export const getMailQueue = (): Queue => {
    if (!queue) {
        queue = new Queue(MAIL_QUEUE, {
            connection: getRedis(),
            defaultJobOptions: {
                attempts: 5,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 1000,
                removeOnFail: 5000,
            },
        });
    }
    return queue;
};

export const closeMailQueue = async (): Promise<void> => {
    if (queue) {
        await queue.close();
        queue = null;
    }
};
