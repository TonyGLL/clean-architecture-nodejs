import { User } from '../../domain/entities/user';

export interface GetUsersDTO {
    page?: number;
    limit?: number;
    search?: string;
}

export interface GetUsersResponseDTO {
    users: User[];
    total: number;
}

export interface CreateUserDTO {
    name: string;
    lastName: string;
    email: string;
    birthDate?: Date;
    phone?: string;
    password?: string;
}

export interface UpdateUserDTO {
    name?: string;
    lastName?: string;
    birthDate?: string;
    phone?: string;
}

export interface ChangePasswordDTO {
    oldPassword?: string;
    newPassword?: string;
}

export interface AssignRoleDTO {
    roleId: number;
}
