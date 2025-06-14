import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { LoginUseCase } from "../../../application/use-cases/auth/login.use-case";

@injectable()
export class AuthController {
    constructor(
        //@inject(RegisterUserCase) private registerUserCase: RegisterUserCase,
        @inject(LoginUseCase) private loginUseCase: LoginUseCase
    ) { }

    public register = (req: Request, res: Response, next: NextFunction) => {
        try {
            //TODO
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