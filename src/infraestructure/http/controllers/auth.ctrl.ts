import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { LoginUseCase, RegisterUseCase, RestorePasswordUseCase } from "../../../application/use-cases/auth.use-case";

@injectable()
export class AuthController {
    constructor(
        @inject(LoginUseCase) private loginUseCase: LoginUseCase,
        @inject(RegisterUseCase) private registerUseCase: RegisterUseCase,
        @inject(RestorePasswordUseCase) private restorePasswordUseCase: RestorePasswordUseCase,
    ) { }

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.loginUseCase.execute(req.body);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.registerUseCase.execute(req.body);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public restorePassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            const [status, data] = await this.restorePasswordUseCase.execute(email);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}