import { RolePermissions } from './role.dto';
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

export interface GetUserDetailsResponseDTO extends User {
    permissions: RolePermissions[];
}

export interface CreateUserDTO {
    name: string;
    lastName: string;
    email: string;
    birth_date?: Date;
    phone?: string;
    password?: string;
}

export interface UpdateUserDTO {
    name?: string;
    lastName?: string;
    birth_date?: string;
    phone?: string;
}

export interface ChangePasswordDTO {
    oldPassword?: string;
    newPassword?: string;
}

export interface AssignRoleDTO {
    roleId: number;
}
