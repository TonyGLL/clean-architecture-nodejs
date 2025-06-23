import { Role } from "../../domain/entities/role";

export interface CreateRoleDTO {
    name: string;
}

export interface GetRolesDTO {
    page: number;
    limit: number;
    search?: string;
}

export interface GetRolesResponseDTO {
    roles: Role[];
    total: number;
}

export interface AssignRoleToUserDTO {
    userId: string;
    roleName: string;
}

export interface RoleResponseDTO {
    id: string | null;
    name: string;
}

export interface UserRoleResponseDTO {
    userId: string;
    roleId: string;
}