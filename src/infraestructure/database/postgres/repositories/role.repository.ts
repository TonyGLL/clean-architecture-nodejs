import { injectable, inject } from 'inversify';
import { Pool, PoolClient } from 'pg';
import { Role } from '../../../../domain/entities/role';
import { IRoleRepository } from '../../../../domain/repositories/role.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';
import { GetPermissionsResponeDTO, GetRolesDTO, GetRolesResponseDTO, RolePermissions } from '../../../../application/dtos/role.dto';
import { HttpError } from '../../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../../domain/shared/http.status';
import e from 'express';

@injectable()
export class PostegresRoleRepository implements IRoleRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async getRoles(filters: GetRolesDTO): Promise<GetRolesResponseDTO> {
        const { page = 0, limit = 10, search = null } = filters;

        try {
            const result = await this.pool.query('SELECT * FROM get_roles($1, $2, $3)', [page, limit, search]);
            const response: GetRolesResponseDTO = {
                roles: result.rows,
                total: result.rows.length ? parseInt(result.rows[0]?.total || '0', 10) : 0
            };
            return response;
        } catch (error) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, error instanceof Error ? error.message : 'Unknown error');
        }
    }

    public async getPermissionsByRole(id: string): Promise<GetPermissionsResponeDTO[]> {
        try {
            const result = await this.pool.query<GetPermissionsResponeDTO>('SELECT * FROM get_permissions_by_role($1)', [id]);
            if (!result.rows.length) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Not found');

            return result.rows;
        } catch (error) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, error instanceof Error ? error.message : 'Unknown error');
        }
    }

    public async createRole(role: Role, client: PoolClient): Promise<Role> {
        const result = await client.query<Role>('SELECT * FROM create_role($1, $2)', [role.name, role.description]);
        return new Role(result.rows[0].id, result.rows[0].name, result.rows[0].description);
    }

    public async assignPermissionsToRole(role_id: string, permissions: RolePermissions[], client: PoolClient): Promise<void> {
        await client.query('SELECT assign_permissions_to_role($1, $2)', [role_id, JSON.stringify(permissions)]);
    }

    public async updateRole(role_id: string, role: Omit<Role, 'permissions'>, client: PoolClient): Promise<void> {
        await client.query('SELECT update_role($1, $2, $3)', [role_id, role.name, role.description]);
    }

    public async updateRolePermissions(role_id: string, permissions: RolePermissions[], client: PoolClient): Promise<void> {
        await client.query('SELECT update_role_permissions($1, $2)', [role_id, JSON.stringify(permissions)]);
    }

    public async deleteRole(role_id: string, client: PoolClient): Promise<void> {
        await client.query('SELECT delete_role($1)', [role_id]);
    }
}
