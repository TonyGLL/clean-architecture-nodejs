import { inject, injectable } from "inversify";
import { GetAllModulesUseCase, GetModuleByIdUseCase, CreateModuleUseCase, UpdateModuleUseCase, DeleteModuleUseCase } from "../../../application/use-cases/modules.use-case";
import { NextFunction, Request, Response } from "express";

@injectable()
export class ModulesController {
    constructor(
        @inject(GetAllModulesUseCase) private getAllModulesUseCase: GetAllModulesUseCase,
        @inject(GetModuleByIdUseCase) private getModuleByIdUseCase: GetModuleByIdUseCase,
        @inject(CreateModuleUseCase) private createModuleUseCase: CreateModuleUseCase,
        @inject(UpdateModuleUseCase) private updateModuleUseCase: UpdateModuleUseCase,
        @inject(DeleteModuleUseCase) private deleteModuleUseCase: DeleteModuleUseCase
    ) { }

    public getAllModules = async (_: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const [status, result] = await this.getAllModulesUseCase.execute();
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public getModuleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const [status, result] = await this.getModuleByIdUseCase.execute(id);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public createModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const [status, result] = await this.createModuleUseCase.execute(req.body);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public updateModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const [status, result] = await this.updateModuleUseCase.execute(id, req.body);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public deleteModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const [status, result] = await this.deleteModuleUseCase.execute(id);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }
}