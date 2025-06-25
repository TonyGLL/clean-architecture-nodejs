import { injectable, inject } from 'inversify';
import { Pool, PoolClient } from 'pg';
import { Role } from '../../../../domain/entities/role';
import { IRoleRepository } from '../../../../domain/repositories/role.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';
import { GetPermissionsResponeDTO, GetRolesDTO, GetRolesResponseDTO, RolePermissions } from '../../../../application/dtos/role.dto';
import { HttpError } from '../../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../../domain/shared/http.status';

@injectable()
export class PostegresRoleRepository implements IRoleRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async getRoles(filters: GetRolesDTO): Promise<GetRolesResponseDTO> {
        const { page = 0, limit = 10, search } = filters;

        //* Validación de parámetros
        if (page < 0 || limit <= 0 || limit > 100) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Parámetros de paginación inválidos');
        }

        const offset = page * limit;
        const params: (string | number)[] = [];
        const conditions: string[] = [];

        // Construcción de condiciones PRIMERO (antes de las consultas)
        if (search) {
            const numericSearch = Number(search);
            const isNumeric = !isNaN(numericSearch) && isFinite(numericSearch);

            if (isNumeric) {
                conditions.push(`(id = $${params.length + 1} OR name ILIKE $${params.length + 2})`);
                params.push(numericSearch, `%${search}%`);
            } else {
                conditions.push(`name ILIKE $${params.length + 1}`);
                params.push(`%${search}%`);
            }
        }

        //* Construcción de consultas DESPUÉS de tener las condiciones y parámetros
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        //* Data query
        const dataQueryText = `
            SELECT 
                id,
                name,
                description,
                created_at,
                updated_at
            FROM roles
            ${whereClause}
            ORDER BY name ASC
            LIMIT $${params.length + 1}
            OFFSET $${params.length + 2}
        `;
        const dataQuery = {
            text: dataQueryText,
            values: [...params, limit, offset]
        };

        //* Count query
        const countQueryText = `
                SELECT COUNT(id) as total
                FROM roles
                ${whereClause}
        `;
        const countQuery = {
            text: countQueryText,
            values: params
        };


        try {
            const [dataResult, countResult] = await Promise.all([
                this.pool.query<Role>(dataQuery),
                this.pool.query<{ total: string }>(countQuery)
            ]);

            const response: GetRolesResponseDTO = {
                roles: dataResult.rows,
                total: dataResult.rows.length ? parseInt(countResult.rows[0]?.total || '0', 10) : 0
            };
            return response;
        } catch (error) {
            throw new HttpError(
                HttpStatusCode.INTERNAL_SERVER_ERROR,
                'Error unknown'
            );
        }
    }

    public async getPermissionsByRole(id: string): Promise<GetPermissionsResponeDTO[]> {
        try {
            const text = `
                SELECT
                    r.id,
                    r.name,
                    r.description,
                    COALESCE(
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'module_id', m.id,
                                    'module_name', m.name,
                                    'can_write', COALESCE(rp.can_write, false),
                                    'can_update', COALESCE(rp.can_update, false),
                                    'can_read', COALESCE(rp.can_read, false),
                                    'can_delete', COALESCE(rp.can_delete, false)
                                )
                            )
                            FROM role_permissions rp
                            JOIN modules m ON rp.module_id = m.id
                            WHERE rp.role_id = r.id
                        ),
                        '[]'::json
                    ) as permissions
                FROM roles r
                WHERE r.id = $1;
            `;
            const query = {
                text,
                values: [id]
            }
            const result = await this.pool.query<GetPermissionsResponeDTO>(query);
            if (!result.rows.length) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Not found');

            return result.rows;
        } catch (error) {
            throw new HttpError(
                HttpStatusCode.INTERNAL_SERVER_ERROR,
                'Error unknown'
            );
        }
    }

    public async createRole(role: Role, client: PoolClient): Promise<Role> {
        const text = 'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id, name, description';
        const query = {
            text,
            values: [role.name, role.description]
        };
        const result = await client.query<Role>(query);
        return new Role(result.rows[0].id, result.rows[0].name, result.rows[0].description);
    }

    public async assignPermissionsToRole(role_id: string, permissions: RolePermissions[], client: PoolClient): Promise<void> {
        const values: any[] = [];
        const placeholders: string[] = [];

        permissions.forEach((perm, index) => {
            const offset = index * 6;
            placeholders.push(
                `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
            );
            values.push(
                parseInt(role_id),
                perm.module_id,
                perm.can_read,
                perm.can_write,
                perm.can_update,
                perm.can_delete
            );
        });

        const query = `
            INSERT INTO role_permissions (
                role_id,
                module_id,
                can_read,
                can_write,
                can_update,
                can_delete
            )
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (role_id, module_id)
            DO UPDATE SET
                can_read = EXCLUDED.can_read,
                can_write = EXCLUDED.can_write,
                can_update = EXCLUDED.can_update,
                can_delete = EXCLUDED.can_delete;
        `;

        await client.query(query, values);
    }

    public async updateRole(role_id: string, role: Omit<Role, 'permissions'>, client: PoolClient): Promise<void> {
        const text = `
            UPDATE roles SET name = $2, description = $3 WHERE id = $1;
        `;
        const query = {
            text,
            values: [role_id, role.name, role.description]
        }
        await client.query(query);
    }

    public async updateRolePermissions(role_id: string, permissions: RolePermissions[], client: PoolClient): Promise<void> {
        const values: any[] = [];
        const valueTuples: string[] = [];

        const roleIdInt = parseInt(role_id);
        if (isNaN(roleIdInt)) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Invalid role_id: not a number');
        }

        permissions.forEach((perm: RolePermissions, index: number) => {
            const offset = index * 6;
            valueTuples.push(
                `($${offset + 1}::int, $${offset + 2}::int, $${offset + 3}::bool, $${offset + 4}::bool, $${offset + 5}::bool, $${offset + 6}::bool)`
            );
            values.push(
                roleIdInt,
                perm.module_id,
                perm.can_read,
                perm.can_write,
                perm.can_update,
                perm.can_delete
            );
        });

        const query = `
            UPDATE role_permissions AS rp
            SET
                can_read = v.can_read,
                can_write = v.can_write,
                can_update = v.can_update,
                can_delete = v.can_delete
            FROM (
                VALUES ${valueTuples.join(', ')}
            ) AS v(role_id, module_id, can_read, can_write, can_update, can_delete)
            WHERE rp.role_id = v.role_id AND rp.module_id = v.module_id;
        `;

        await client.query(query, values);
    }

    public async deleteRole(role_id: string, client: PoolClient): Promise<void> {
        const text = `
            DELETE FROM roles WHERE id = $1;
        `;
        const query = {
            text,
            values: [role_id]
        }
        await client.query(query);
    }
}
