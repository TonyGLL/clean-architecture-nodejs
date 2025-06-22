import { injectable, inject } from 'inversify';
import { Pool } from 'pg';
import { Role } from '../../../../domain/entities/role';
import { IRoleRepository } from '../../../../domain/repositories/role.repository';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';
import { GetRolesDTO } from '../../../../application/dtos/role.dto';
import { HttpError } from '../../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../../domain/shared/http.status';

@injectable()
export class PostegresRoleRepository implements IRoleRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async getRoles(filters: GetRolesDTO): Promise<Role[]> {
        const query = {
            text: '',
            values: [filters.page, filters.page, filters.search]
        }
        const results = await this.pool.query(query);
        if (!results.rows.length) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Not found');

        return results.rows;
    }

    async createRole(role: Role): Promise<Role> {
        const query = 'INSERT INTO roles (name) VALUES ($1) RETURNING id, name';
        const values = [role.name];
        const result = await this.pool.query(query, values);
        return new Role(result.rows[0].id, result.rows[0].name);
    }
}
