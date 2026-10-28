import 'reflect-metadata';
import { PostgresRoleRepository } from '../../infraestructure/database/postgres/repositories/role.repository';

const build = (row: object) => new PostgresRoleRepository({ query: jest.fn().mockResolvedValue({ rows: [row] }) } as any);

describe('PostgresRoleRepository.getRoles', () => {
    it('returns the roles and the total', async () => {
        const roles = [{ id: 1, name: 'SuperAdmin' }];
        expect(await build({ roles, total: '3' }).getRoles({ page: 0, limit: 10 } as any)).toEqual({ roles, total: 3 });
    });

    it('returns an empty list instead of failing on a page without rows (json_agg gives NULL)', async () => {
        expect(await build({ roles: null, total: '3' }).getRoles({ page: 5, limit: 10 } as any)).toEqual({ roles: [], total: 0 });
    });
});
