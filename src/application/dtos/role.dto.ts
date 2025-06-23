import { Role } from "../../domain/entities/role";

export interface CreateRoleDTO {
    name: string;
    description: string;
    permissions: RolePermissions[];
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

export interface GetPermissionsDTO {
    id: string;
}

export interface RolePermissions {
    module_id: number;
    module_name: string;
    can_write: boolean;
    can_update: boolean;
    can_read: boolean;
    can_delete: boolean;
}
export interface GetPermissionsResponeDTO {
    id: number;
    name: string;
    permissions: RolePermissions[];
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