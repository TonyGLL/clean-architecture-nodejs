import { inject, injectable } from "inversify";
import { GetAllModulesUseCase } from "../../../application/use-cases/modules.use-case";
import { NextFunction, Request, Response } from "express";

@injectable()
export class ModulesController {
    constructor(
        @inject(GetAllModulesUseCase) private getAllModulesUseCase: GetAllModulesUseCase
    ) { }

    public getAllModules = async (_: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const [status, result] = await this.getAllModulesUseCase.execute();
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }
}