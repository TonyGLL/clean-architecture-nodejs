export interface IMailService {
    sendRestorePasswordEmail(email: string): Promise<void>;
}