import { injectable } from 'inversify';
import { IMailService } from '../../../domain/services/mail.service';
import { withTimeout } from '../../queue/redis';
import { getMailQueue, MailJob } from '../../queue/mail.queue';

/**
 * IMailService that enqueues the email instead of sending it inside the HTTP request.
 * The worker process (see queue/mail.worker.ts) delivers it with retries and backoff.
 */
@injectable()
export class QueuedMailService implements IMailService {
    public async sendRestorePasswordEmail(email: string, token: string): Promise<void> {
        await this.enqueue({ name: 'restore-password', data: { email, token } });
    }

    public async sendPasswordChangedEmail(email: string): Promise<void> {
        await this.enqueue({ name: 'password-changed', data: { email } });
    }

    private async enqueue(job: MailJob): Promise<void> {
        await withTimeout(getMailQueue().add(job.name, job.data), 5000);
    }
}
