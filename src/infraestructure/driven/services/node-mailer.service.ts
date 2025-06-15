import { injectable } from "inversify";
import { IMailService } from "../../../domain/services/mail.service";

@injectable()
export class NodeMailerService implements IMailService {
    public async sendRestorePasswordEmail(email: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}