import { injectable, inject } from 'inversify';
import { Pool, PoolClient } from 'pg';
import { User } from '../../../../domain/entities/user';
import { IUserRepository } from '../../../../domain/repositories/user.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';
import { GetUserDetailsResponseDTO, GetUsersDTO, GetUsersResponseDTO, UpdateUserDTO } from '../../../../application/dtos/user.dto';
import { HttpError } from '../../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../../domain/shared/http.status';

@injectable()
export class PostgresUserRepository implements IUserRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async updateLastAccess(clientId: number, client: PoolClient): Promise<void> {
        try {
            const query = {
                text: "UPDATE users SET last_access = NOW() WHERE id = $1",
                values: [clientId]
            }
            await client.query(query);
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error updating last access time');
        }
    }

    public async getUsers(filters: GetUsersDTO): Promise<GetUsersResponseDTO> {
        const { page = 0, limit = 10, search } = filters;
        const offset = page * limit;
        const params: (string | number)[] = [];
        let whereClause = 'WHERE deleted IS FALSE';

        if (search) {
            whereClause = ` AND name ILIKE $1 OR email ILIKE $1`;
            params.push(`%${search}%`);
        }

        const dataQuery = {
            text: `SELECT id, name, last_name, email, birth_date, phone, created_at, updated_at, last_access FROM users ${whereClause} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            values: [...params, limit, offset]
        };

        const countQuery = {
            text: `SELECT COUNT(id) as total FROM users ${whereClause}`,
            values: params
        };

        const [dataResult, countResult] = await Promise.all([
            this.pool.query<User>(dataQuery),
            this.pool.query<{ total: string }>(countQuery)
        ]);

        return {
            users: dataResult.rows,
            total: parseInt(countResult.rows[0]?.total || '0', 10)
        };
    }

    public async getUserDetailsById(id: number): Promise<GetUserDetailsResponseDTO | null> {
        const query = {
            text: `
                SELECT
                    u.id,
                    u.name,
                    u.last_name,
                    u.email,
                    u.birth_date,
                    u.phone,
                    COALESCE(
                        jsonb_agg(
                            DISTINCT jsonb_build_object(
                                'id', r.id,
                                'name', r.name,
                                'description', r.description,
                                'permissions', (
                                    SELECT jsonb_agg(
                                        jsonb_build_object(
                                            'id', p.id,
                                            'module_name', m.name,
                                            'module_description', m.description,
                                            'module_id', p.module_id,
                                            'can_read', p.can_read,
                                            'can_write', p.can_write,
                                            'can_update', p.can_update,
                                            'can_delete', p.can_delete
                                        )
                                    )
                                    FROM role_permissions p
                                    INNER JOIN modules m ON p.module_id = m.id
                                    WHERE p.role_id = r.id
                                )
                            )
                        ) FILTER (WHERE r.id IS NOT NULL),
                        '[]'
                    ) AS roles
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = $1 AND u.deleted IS FALSE
                GROUP BY u.id;
            `,
            values: [id]
        };
        const result = await this.pool.query<GetUserDetailsResponseDTO>(query);
        return result.rows[0] || null;
    }

    public async findById(id: number): Promise<User | null> {
        const result = await this.pool.query<User>('SELECT * FROM users u WHERE u.id = $1 AND u.deleted IS FALSE', [id]);
        return result.rows[0] || null;
    }

    public async findByEmail(email: string): Promise<User | null> {
        const result = await this.pool.query<User>(`
                SELECT 
                    u.*,
                    p.hash as password,
                    COALESCE(
                            jsonb_agg(
                                DISTINCT jsonb_build_object(
                                    'id', r.id,
                                    'name', r.name,
                                    'description', r.description,
                                    'permissions', (
                                        SELECT jsonb_agg(
                                            jsonb_build_object(
                                                'id', p.id,
                                                'module_name', m.name,
                                                'module_id', p.module_id,
                                                'can_read', p.can_read,
                                                'can_write', p.can_write,
                                                'can_update', p.can_update,
                                                'can_delete', p.can_delete
                                            )
                                        )
                                        FROM role_permissions p
                                        INNER JOIN modules m ON p.module_id = m.id
                                        WHERE p.role_id = r.id
                                    )
                                )
                            ) FILTER (WHERE r.id IS NOT NULL),
                            '[]'
                        ) AS roles
                    FROM users u 
                    INNER JOIN passwords p ON p.user_id = u.id
                    LEFT JOIN user_roles ur ON u.id = ur.user_id
                    LEFT JOIN roles r ON ur.role_id = r.id
                    WHERE u.email = $1 AND u.deleted IS FALSE
                    GROUP BY u.id, p.hash;
            `, [email]);
        const { id, name, last_name, birth_date, phone, password, roles } = result.rows[0];
        return new User(id, name, last_name, email, birth_date, phone, password, undefined, undefined, roles);
    }

    public async create(user: User, client: PoolClient): Promise<User> {
        const query = {
            text: 'INSERT INTO users (name, last_name, email, birth_date, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, last_name, email, birth_date, phone',
            values: [user.name, user.last_name, user.email, user.birth_date, user.phone]
        };
        const result = await client.query<User>(query);
        return result.rows[0];
    }

    public async update(id: number, user: Partial<UpdateUserDTO>, client: PoolClient): Promise<void> {
        const fields = Object.keys(user).map((key, i) => `${key} = $${i + 2}`).join(', ');
        const values = Object.values(user);
        const query = {
            text: `UPDATE users SET ${fields} WHERE id = $1 AND deleted IS FALSE`,
            values: [id, ...values]
        };
        await client.query(query);
    }

    public async delete(id: number, client: PoolClient): Promise<void> {
        await client.query('UPDATE users SET deleted = TRUE WHERE id = $1 AND deleted IS FALSE', [id]);
    }

    public async updatePassword(userId: number, hash: string, client: PoolClient): Promise<void> {
        const query = {
            text: 'INSERT INTO passwords (user_id, hash) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET hash = $2, updated_at = NOW()',
            values: [userId, hash]
        };
        await client.query(query);
    }
}
