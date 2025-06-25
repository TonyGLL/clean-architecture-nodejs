import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { LoginClientUseCase, RegisterClientUseCase, SendEmailClientUseCase, RestorePasswordClientUseCase } from "../../../application/use-cases/auth.client.use-case";

@injectable()
export class AuthController {
    constructor(
        @inject(LoginClientUseCase) private loginClientUseCase: LoginClientUseCase,
        @inject(RegisterClientUseCase) private registerClientUseCase: RegisterClientUseCase,
        @inject(SendEmailClientUseCase) private sendEmailClientUseCase: SendEmailClientUseCase,
        @inject(RestorePasswordClientUseCase) private restorePasswordClientUseCase: RestorePasswordClientUseCase,
    ) { }

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.loginClientUseCase.execute(req.body);
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
            const [status, data] = await this.sendEmailClientUseCase.execute(email);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public restorePassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const { token } = req.params;
            const [status, data] = await this.restorePasswordClientUseCase.execute({ email, password, token });
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}