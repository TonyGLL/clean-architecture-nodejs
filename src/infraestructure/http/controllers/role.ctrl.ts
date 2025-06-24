import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { CreateRoleUseCase, GetPermissionsByRoleUseCase, GetRolesUseCase } from '../../../application/use-cases/role.use-case';
import { CreateRoleDTO, GetRolesDTO } from '../../../application/dtos/role.dto';

@injectable()
export class RoleController {
    constructor(
        @inject(CreateRoleUseCase) private createRoleUseCase: CreateRoleUseCase,
        @inject(GetPermissionsByRoleUseCase) private getPermissionsByRoleUseCase: GetPermissionsByRoleUseCase,
        @inject(GetRolesUseCase) private getRolesUseCase: GetRolesUseCase
    ) { }

    public getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pageStr = req.query.page as string | undefined;
            const limitStr = req.query.limit as string | undefined;
            const search = req.query.search as string | undefined;

            const dto: GetRolesDTO = {
                page: Number.parseInt(pageStr!),
                limit: Number.parseInt(limitStr!)
            };

            if (search) dto.search = search;

            const [status, result] = await this.getRolesUseCase.execute(dto);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public getPermissionsByRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const [status, result] = await this.getPermissionsByRoleUseCase.execute(id);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto: CreateRoleDTO = req.body;
            const [status, result] = await this.createRoleUseCase.execute(dto);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
        } catch (error) {
            next(error);
        }
    }

    public deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    }
}
