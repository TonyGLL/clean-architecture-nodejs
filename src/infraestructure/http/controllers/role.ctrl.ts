import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { APPLICATION_TYPES } from '../../../application/ioc.types';
import { CreateRoleUseCase, GetRolesUseCase } from '../../../application/use-cases/role.use-case';
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';
import { CreateRoleDTO, GetRolesDTO } from '../../../application/dtos/role.dto';

@injectable()
export class RoleController {
    constructor(
        @inject(APPLICATION_TYPES.CreateRoleUseCase) private createRoleUseCase: CreateRoleUseCase,
        @inject(APPLICATION_TYPES.GetRolesUseCase) private getRolesUseCase: GetRolesUseCase
    ) { }

    public async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    public async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto: CreateRoleDTO = req.body;
            const [status, result] = await this.createRoleUseCase.execute(dto);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {

    }

    public async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {

    }
}
