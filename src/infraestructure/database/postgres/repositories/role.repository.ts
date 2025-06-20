import { injectable, inject } from 'inversify';
import { Pool } from 'pg';
import { Role } from '../../../../domain/entities/role';
import { IRoleRepository } from '../../../../domain/repositories/role.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';

@injectable()
export class PgRoleRepository implements IRoleRepository {
    constructor(@inject(INFRASTRUCTURE_TYPES.Pool) private pool: Pool) { }

    async createRole(role: Role): Promise<Role> {
        const query = 'INSERT INTO roles (name) VALUES ($1) RETURNING id, name';
        const values = [role.name];
        const result = await this.pool.query(query, values);
        return new Role(result.rows[0].id, result.rows[0].name);
    }

    async findRoleByName(name: string): Promise<Role | null> {
        const query = 'SELECT id, name FROM roles WHERE name = $1';
        const values = [name];
        const result = await this.pool.query(query, values);
        if (result.rows.length === 0) {
            return null;
        }
        return new Role(result.rows[0].id, result.rows[0].name);
    }

    async findRoleById(id: string): Promise<Role | null> { // Implementation for findRoleById
        const query = 'SELECT id, name FROM roles WHERE id = $1';
        const values = [id];
        const result = await this.pool.query(query, values);
        if (result.rows.length === 0) {
            return null;
        }
        return new Role(result.rows[0].id, result.rows[0].name);
    }
}
