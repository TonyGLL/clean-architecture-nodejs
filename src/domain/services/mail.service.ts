export interface IMailService {
    sendRestorePasswordEmail(email: string, token: string): Promise<void>;
}