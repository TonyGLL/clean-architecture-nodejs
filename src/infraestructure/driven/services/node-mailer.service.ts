import { injectable } from "inversify";
import * as nodemailer from 'nodemailer';
import { IMailService } from "../../../domain/services/mail.service";
import { config } from "../../config/env"; // Correct path to env config

@injectable()
export class NodeMailerService implements IMailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_PORT === 465, // true for 465, false for other ports
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
            },
        });
    }

    public async sendRestorePasswordEmail(email: string, token: string): Promise<void> {
        const mailOptions = {
            from: config.EMAIL_FROM,
            to: email,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset. Please use the following token to reset your password: <strong>${token}</strong></p><p>If you didn't request this, please ignore this email.</p>`,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            throw new Error("Failed to send password reset email.");
        }
    }
}