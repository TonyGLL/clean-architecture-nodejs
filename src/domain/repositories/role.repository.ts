import { PoolClient } from 'pg';
import { GetPermissionsResponeDTO, GetRolesDTO, GetRolesResponseDTO, RolePermissions } from '../../application/dtos/role.dto';
import { Role } from '../entities/role';

export interface IRoleRepository {
    getRoles(filters: GetRolesDTO): Promise<GetRolesResponseDTO>;
    getPermissionsByRole(id: string): Promise<GetPermissionsResponeDTO[]>;
    createRole(role: Role, client: PoolClient): Promise<Role>;
    assignPermissionsToRole(role_id: string, permissions: RolePermissions[], client: PoolClient): Promise<void>;
    updateRole(role_id: string, role: Omit<Role, 'permissions'>, client: PoolClient): Promise<void>;
    updateRolePermissions(role_id: string, permissions: RolePermissions[], client: PoolClient): Promise<void>;
    deleteRole(role_id: string, client: PoolClient): Promise<void>;
}
