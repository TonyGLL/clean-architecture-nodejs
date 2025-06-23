import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { CreateRoleUseCase, GetRolesUseCase } from '../../../application/use-cases/role.use-case';
import { CreateRoleDTO, GetRolesDTO } from '../../../application/dtos/role.dto';

@injectable()
export class RoleController {
    constructor(
        @inject(CreateRoleUseCase) private createRoleUseCase: CreateRoleUseCase,
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

    }

    public deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    }
}
