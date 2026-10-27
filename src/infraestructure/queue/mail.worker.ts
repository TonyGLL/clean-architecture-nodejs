import { Worker } from 'bullmq';
import { container } from '../ioc/config';
import { NodeMailerService } from '../driven/services/node-mailer.service';
import { logger } from '../config/winston';
import { MAIL_QUEUE, MailJob } from './mail.queue';
import { createWorkerRedis } from './redis';

/** Consumes the mail queue and delivers emails via SMTP. Throwing makes BullMQ retry the job. */
export const startMailWorker = (): Worker => {
    const mailer = container.get(NodeMailerService);

    const worker = new Worker(
        MAIL_QUEUE,
        async job => {
            const { name, data } = job as unknown as MailJob;
            switch (name) {
                case 'restore-password':
                    return mailer.sendRestorePasswordEmail(data.email, data.token);
                case 'password-changed':
                    return mailer.sendPasswordChangedEmail(data.email);
                default:
                    throw new Error(`Unknown mail job: ${job.name}`);
            }
        },
        { connection: createWorkerRedis(), concurrency: 5 },
    );

    worker.on('failed', (job, error) => logger.error(`Mail job ${job?.id} (${job?.name}) failed`, { error: error.message, attempts: job?.attemptsMade }));
    worker.on('completed', job => logger.info(`Mail job ${job.id} (${job.name}) sent`));
    return worker;
};
