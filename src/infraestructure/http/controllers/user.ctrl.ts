import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { GetUsersUseCase, CreateUserUseCase, UpdateUserUseCase, DeleteUserUseCase, ChangePasswordUseCase, AssignRoleToUserUseCase, GetUserDetailsUseCase } from '../../../application/use-cases/user.use-case';
import { CreateUserDTO, UpdateUserDTO, ChangePasswordDTO, AssignRoleDTO, GetUsersDTO } from '../../../application/dtos/user.dto';

@injectable()
export class UserController {
    constructor(
        @inject(GetUsersUseCase) private getUsersUseCase: GetUsersUseCase,
        @inject(GetUserDetailsUseCase) private getUserDetailsUseCase: GetUserDetailsUseCase,
        @inject(CreateUserUseCase) private createUserUseCase: CreateUserUseCase,
        @inject(UpdateUserUseCase) private updateUserUseCase: UpdateUserUseCase,
        @inject(DeleteUserUseCase) private deleteUserUseCase: DeleteUserUseCase,
        @inject(ChangePasswordUseCase) private changePasswordUseCase: ChangePasswordUseCase,
        @inject(AssignRoleToUserUseCase) private assignRoleToUserUseCase: AssignRoleToUserUseCase
    ) { }

    public getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto: GetUsersDTO = {
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
                search: req.query.search as string | undefined
            };
            const [status, result] = await this.getUsersUseCase.execute(dto);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public getUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const [status, result] = await this.getUserDetailsUseCase.execute(Number(id));
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto: CreateUserDTO = req.body;
            const [status, result] = await this.createUserUseCase.execute(dto);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const dto: UpdateUserDTO = req.body;
            const [status, result] = await this.updateUserUseCase.execute(Number(id), dto);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const [status, result] = await this.deleteUserUseCase.execute(Number(id));
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const dto: ChangePasswordDTO = req.body;
            const [status, result] = await this.changePasswordUseCase.execute(Number(id), dto);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public assignRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const dto: AssignRoleDTO = req.body;
            const [status, result] = await this.assignRoleToUserUseCase.execute(Number(id), dto);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }
}
