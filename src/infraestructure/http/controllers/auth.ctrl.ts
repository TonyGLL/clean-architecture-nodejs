import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { LoginUseCase } from "../../../application/use-cases/auth/login.use-case";
import { RegisterUseCase } from "../../../application/use-cases/auth/register.use-case";

@injectable()
export class AuthController {
    constructor(
        @inject(RegisterUseCase) private registerUseCase: RegisterUseCase,
        @inject(LoginUseCase) private loginUseCase: LoginUseCase
    ) { }

    public register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.registerUseCase.execute(req.body);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.loginUseCase.execute(req.body);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}