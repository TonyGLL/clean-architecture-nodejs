import { injectable, inject } from 'inversify';
import { Pool, PoolClient } from 'pg';
import { UserRole } from '../../../../domain/entities/userRole';
import { IUserRoleRepository } from '../../../../domain/repositories/userRole.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';

@injectable()
export class PostgresUserRoleRepository implements IUserRoleRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    async assignRoleToUser(userRole: UserRole, client: PoolClient): Promise<UserRole> {
        const query = 'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) RETURNING user_id, role_id';
        const values = [userRole.userId, userRole.roleId];
        const result = await client.query(query, values);
        return new UserRole(result.rows[0].user_id, result.rows[0].role_id);
    }

    async removeRoleFromUser(userId: string, roleId: string): Promise<void> { // Implementation for removeRoleFromUser
        const query = 'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2';
        const values = [userId, roleId];
        await this.pool.query(query, values);
    }
}
