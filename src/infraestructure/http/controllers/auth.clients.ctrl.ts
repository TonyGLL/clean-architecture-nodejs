import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { LoginUseCase, RegisterClientUseCase, SendEmailUseCase, RestorePasswordUseCase } from "../../../application/use-cases/auth.use-case";

@injectable()
export class AuthClientsController {
    constructor(
        @inject(LoginUseCase) private loginUseCase: LoginUseCase,
        @inject(RegisterClientUseCase) private registerClientUseCase: RegisterClientUseCase,
        @inject(SendEmailUseCase) private sendEmailUseCase: SendEmailUseCase,
        @inject(RestorePasswordUseCase) private restorePasswordUseCase: RestorePasswordUseCase,
    ) { }

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.loginUseCase.execute(req.body, 'client');
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.registerClientUseCase.execute(req.body);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public sendEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            const [status, data] = await this.sendEmailUseCase.execute(email, 'client');
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public restorePassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const { token } = req.params;
            const [status, data] = await this.restorePasswordUseCase.execute({ email, password, token }, 'client');
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}