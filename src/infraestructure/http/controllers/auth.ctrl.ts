import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { AuthUseCase } from "../../../application/use-cases/auth.use-case";

@injectable()
export class AuthController {
    constructor(
        @inject(AuthUseCase) private authUseCase: AuthUseCase
    ) { }

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.authUseCase.executeLogin(req.body);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const [status, data] = await this.authUseCase.executeRegister(req.body);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}