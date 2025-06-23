import { PoolClient } from 'pg';
import { GetPermissionsResponeDTO, GetRolesDTO, GetRolesResponseDTO, RolePermissions } from '../../application/dtos/role.dto';
import { Role } from '../entities/role';

export interface IRoleRepository {
    getRoles(filters: GetRolesDTO): Promise<GetRolesResponseDTO>;
    getPermissionsByRole(id: string): Promise<GetPermissionsResponeDTO[]>;
    createRole(role: Role, client: PoolClient): Promise<Role>;
    assignPermissionsToRole(role_id: string, permissions: RolePermissions[], client: PoolClient): Promise<void>;
}
