import { injectable, inject } from 'inversify';
import { Pool } from 'pg';
import { UserRole } from '../../../../domain/entities/userRole';
import { Role } from '../../../../domain/entities/role';
import { IUserRoleRepository } from '../../../../domain/repositories/userRole.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';

@injectable()
export class PostgresUserRoleRepository implements IUserRoleRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    async assignRoleToUser(userRole: UserRole): Promise<UserRole> {
        const query = 'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) RETURNING user_id, role_id';
        const values = [userRole.userId, userRole.roleId];
        const result = await this.pool.query(query, values);
        return new UserRole(result.rows[0].user_id, result.rows[0].role_id);
    }

    /* async findRolesByUserId(userId: string): Promise<Role[]> {
        const query = `
            SELECT r.id, r.name
            FROM roles r
            INNER JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = $1
        `;
        const values = [userId];
        const result = await this.pool.query(query, values);
        return result.rows.map(row => new Role(row.id, row.name));
    } */

    async removeRoleFromUser(userId: string, roleId: string): Promise<void> { // Implementation for removeRoleFromUser
        const query = 'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2';
        const values = [userId, roleId];
        await this.pool.query(query, values);
    }
}
