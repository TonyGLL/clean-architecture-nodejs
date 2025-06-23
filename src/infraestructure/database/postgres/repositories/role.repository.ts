import { injectable, inject } from 'inversify';
import { Pool } from 'pg';
import { Role } from '../../../../domain/entities/role';
import { IRoleRepository } from '../../../../domain/repositories/role.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';
import { GetRolesDTO, GetRolesResponseDTO } from '../../../../application/dtos/role.dto';
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

    async createRole(role: Role): Promise<Role> {
        const query = 'INSERT INTO roles (name) VALUES ($1) RETURNING id, name';
        const values = [role.name];
        const result = await this.pool.query(query, values);
        return new Role(result.rows[0].id, result.rows[0].name);
    }
}
