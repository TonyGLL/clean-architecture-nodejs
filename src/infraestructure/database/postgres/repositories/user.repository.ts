import { injectable, inject } from 'inversify';
import { Pool, PoolClient } from 'pg';
import { User } from '../../../../domain/entities/user';
import { IUserRepository } from '../../../../domain/repositories/user.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';
import { GetUserDetailsResponseDTO, GetUsersDTO, GetUsersResponseDTO, UpdateUserDTO } from '../../../../application/dtos/user.dto';

@injectable()
export class PostgresUserRepository implements IUserRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async getUsers(filters: GetUsersDTO): Promise<GetUsersResponseDTO> {
        const { page = 0, limit = 10, search } = filters;
        const offset = page * limit;
        const params: (string | number)[] = [];
        let whereClause = 'WHERE deleted IS FALSE';

        if (search) {
            whereClause = ` and name ILIKE $1 OR email ILIKE $1`;
            params.push(`%${search}%`);
        }

        const dataQuery = {
            text: `SELECT id, name, last_name, email, birth_date, phone, created_at, updated_at FROM users ${whereClause} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
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
                    u.*,
                    COALESCE(json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL), '[]') as roles,
                    COALESCE(json_agg(DISTINCT p.*) FILTER (WHERE p.module_id IS NOT NULL), '[]') as permissions
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                LEFT JOIN role_permissions p ON r.id = p.role_id
                WHERE u.id = $1 and u.deleted IS FALSE
                GROUP BY u.id;
            `,
            values: [id]
        };
        const result = await this.pool.query<GetUserDetailsResponseDTO>(query);
        return result.rows[0] || null;
    }

    public async findById(id: number): Promise<User | null> {
        const result = await this.pool.query<User>('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    public async findByEmail(email: string): Promise<User | null> {
        const [result] = (await this.pool.query<User>('SELECT u.*, p.hash as password FROM users u INNER JOIN passwords p ON p.user_id = u.id WHERE u.email = $1', [email])).rows;
        const { id, name, last_name, birth_date, phone, password } = result;
        return new User(id, name, last_name, email, birth_date, phone, password);
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
            text: `UPDATE users SET ${fields} WHERE id = $1 and deleted IS FALSE`,
            values: [id, ...values]
        };
        await client.query(query);
    }

    public async delete(id: number, client: PoolClient): Promise<void> {
        await client.query('UPDATE users SET deleted = TRUE WHERE id = $1 and deleted IS FALSE', [id]);
    }

    public async updatePassword(userId: number, hash: string, client: PoolClient): Promise<void> {
        const query = {
            text: 'INSERT INTO passwords (user_id, hash) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET hash = $2, updated_at = NOW()',
            values: [userId, hash]
        };
        await client.query(query);
    }
}
