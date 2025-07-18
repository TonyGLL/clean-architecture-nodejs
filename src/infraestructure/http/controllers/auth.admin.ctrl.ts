import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { LoginUseCase, SendEmailUseCase, RestorePasswordUseCase } from "../../../application/use-cases/auth.use-case";

@injectable()
export class AuthAdminController {
    constructor(
        @inject(LoginUseCase) private loginUseCase: LoginUseCase,
        @inject(SendEmailUseCase) private sendEmailUseCase: SendEmailUseCase,
        @inject(RestorePasswordUseCase) private restorePasswordUseCase: RestorePasswordUseCase,
    ) { }

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.loginUseCase.execute(req.body, 'admin');
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public sendEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            const [status, data] = await this.sendEmailUseCase.execute(email, 'admin');
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public restorePassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const { token } = req.params;
            const [status, data] = await this.restorePasswordUseCase.execute({ email, password, token }, 'admin');
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}