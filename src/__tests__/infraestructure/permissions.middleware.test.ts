import 'reflect-metadata';
import { Request } from 'express';

const getModuleByName = jest.fn();
const getPermissionByRoleAndModule = jest.fn();

jest.mock('../../infraestructure/ioc/config', () => ({
    container: {
        get: (type: symbol) => String(type).includes('IModulesRepository')
            ? { getModuleByName }
            : { getPermissionByRoleAndModule },
    },
}));

import { permissionsMiddleware } from '../../infraestructure/http/middlewares/permissions.middleware';
import { HttpError } from '../../domain/errors/http.error';

const run = async (roles: number[], method = 'GET') => {
    const next = jest.fn();
    const req = { user: { id: '1', roles }, path: '/roles/1', method } as unknown as Request;
    await permissionsMiddleware(req, {} as any, next);
    return next;
};

describe('permissionsMiddleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getModuleByName.mockResolvedValue({ id: '5', name: 'roles' });
    });

    it('allows access when at least one role has the permission', async () => {
        getPermissionByRoleAndModule.mockImplementation(async ({ roleId }) => ({ can_read: roleId === 2 }));
        const next = await run([1, 2]);
        expect(next).toHaveBeenCalledWith();
    });

    it('denies access with 403 when no role has the permission', async () => {
        getPermissionByRoleAndModule.mockResolvedValue({ can_read: false });
        const next = await run([1, 2]);
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(403);
    });

    it('maps POST to can_write', async () => {
        getPermissionByRoleAndModule.mockResolvedValue({ can_read: true, can_write: false });
        const next = await run([1], 'POST');
        expect(next.mock.calls[0][0].statusCode).toBe(403);
    });
});
