import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { APPLICATION_TYPES } from '../../../application/ioc.types';
import { CreateRoleUseCase, AssignRoleToUserUseCase, GetRolesForUserUseCase, RevokeRoleFromUserUseCase } from '../../../application/use-cases/role.use-case';
import { CreateRoleDTO, AssignRoleToUserDTO } from '../../../application/use-cases/role.use-case'; // DTOs
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';

@injectable()
export class RoleController {
    constructor(
        @inject(APPLICATION_TYPES.CreateRoleUseCase) private createRoleUseCase: CreateRoleUseCase,
        @inject(APPLICATION_TYPES.AssignRoleToUserUseCase) private assignRoleToUserUseCase: AssignRoleToUserUseCase,
        @inject(APPLICATION_TYPES.GetRolesForUserUseCase) private getRolesForUserUseCase: GetRolesForUserUseCase,
        @inject(APPLICATION_TYPES.RevokeRoleFromUserUseCase) private revokeRoleFromUserUseCase: RevokeRoleFromUserUseCase
    ) { }

    async createRole(req: Request, res: Response): Promise<void> {
        try {
            const dto: CreateRoleDTO = req.body;
            const [status, result] = await this.createRoleUseCase.execute(dto);
            res.status(status).json(result);
        } catch (error) {
            if (error instanceof HttpError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
            }
        }
    }

    async assignRoleToUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { roleName } = req.body;
            const dto: AssignRoleToUserDTO = { userId, roleName };
            const [status, result] = await this.assignRoleToUserUseCase.execute(dto);
            res.status(status).json(result);
        } catch (error) {
            if (error instanceof HttpError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
            }
        }
    }

    async getRolesForUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const [status, result] = await this.getRolesForUserUseCase.execute(userId);
            res.status(status).json(result);
        } catch (error) {
            if (error instanceof HttpError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
            }
        }
    }

    async revokeRoleFromUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId, roleName } = req.params; // Assuming roleName in params for DELETE
            const [status, result] = await this.revokeRoleFromUserUseCase.execute(userId, roleName);
            res.status(status).json(result);
        } catch (error) {
            if (error instanceof HttpError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
            }
        }
    }
}
