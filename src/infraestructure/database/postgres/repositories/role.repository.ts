import { injectable, inject } from 'inversify';
import { Pool } from 'pg';
import { Role } from '../../../../domain/entities/role';
import { IRoleRepository } from '../../../../domain/repositories/role.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';
import { GetRolesDTO } from '../../../../application/dtos/role.dto';

@injectable()
export class PostegresRoleRepository implements IRoleRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async getRoles(filters: GetRolesDTO): Promise<Role[]> {

        throw new Error('Method not implemented.');
    }

    async createRole(role: Role): Promise<Role> {
        const query = 'INSERT INTO roles (name) VALUES ($1) RETURNING id, name';
        const values = [role.name];
        const result = await this.pool.query(query, values);
        return new Role(result.rows[0].id, result.rows[0].name);
    }
}
