import { permissionsMiddleware } from '../infraestructure/http/middlewares/permissions.middleware';
import { HttpError } from '../domain/errors/http.error';
import { HttpStatusCode } from '../domain/shared/http.status';
import { NextFunction, Request, Response } from 'express';
import { GetPermissionsByRoleUseCase } from '../application/use-cases/role.use-case';
// Import container for type checking, but we will mock its `get` method.
import { container as actualContainer } from '../infraestructure/ioc/config';
import { APPLICATION_TYPES } from '../application/ioc.types';

// Mock Express Request, Response, NextFunction
const mockRequest = (userData: any, baseUrl: string, method: string): Partial<Request> => ({
    user: userData,
    baseUrl,
    method,
    header: jest.fn()
});

const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

// Mock GetPermissionsByRoleUseCase
const mockGetPermissionsByRoleUseCaseInstance = {
    execute: jest.fn()
};

// Mock container.get specifically for GetPermissionsByRoleUseCase
jest.mock('../infraestructure/ioc/config', () => ({
    container: {
        get: jest.fn((token: symbol) => {
            if (token === APPLICATION_TYPES.GetPermissionsByRoleUseCase) {
                return mockGetPermissionsByRoleUseCaseInstance;
            }
            // You might need to return other mocks if other services are fetched via container.get in the middleware
            // For now, this handles the specific use case.
            return jest.fn();
        })
    }
}));


describe('Permissions Middleware', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Reset the execute mock specifically
        mockGetPermissionsByRoleUseCaseInstance.execute.mockReset();
    });

    it('should allow access if user has correct permissions', async () => {
        const req = mockRequest(
            { id: 'user1', roles: [{ id: 'role1', name: 'Admin' }] },
            '/api/v1/users',
            'GET'
        ) as Request;
        const res = mockResponse() as Response;

        mockGetPermissionsByRoleUseCaseInstance.execute.mockResolvedValueOnce([
            HttpStatusCode.OK,
            [{
                id: 'role1', name: 'Admin', description: 'Admin role',
                permissions: [{ module_name: 'users', module_id: 1, can_read: true, can_write: false, can_update: false, can_delete: false }]
            }]
        ]);

        await permissionsMiddleware(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(); // No error passed to next
        expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should deny access if user does not have correct permissions for the module', async () => {
        const req = mockRequest(
            { id: 'user1', roles: [{ id: 'role1', name: 'Editor' }] },
            '/api/v1/articles', // Attempting to access 'articles'
            'POST'
        ) as Request;
        const res = mockResponse() as Response;

        mockGetPermissionsByRoleUseCaseInstance.execute.mockResolvedValueOnce([
            HttpStatusCode.OK,
            [{
                id: 'role1', name: 'Editor', description: 'Editor role',
                permissions: [{ module_name: 'users', module_id: 1, can_read: true, can_write: true, can_update: false, can_delete: false }] // Has perm for 'users', not 'articles'
            }]
        ]);

        await permissionsMiddleware(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(HttpError));
        const error = mockNext.mock.calls[0][0] as HttpError;
        expect(error.statusCode).toBe(HttpStatusCode.FORBIDDEN);
        expect(error.message).toContain('Forbidden: You do not have permission to POST on module articles');
    });

    it('should deny access if user role has no permissions for the action', async () => {
        const req = mockRequest(
            { id: 'user1', roles: [{ id: 'role1', name: 'Viewer' }] },
            '/api/v1/users',
            'POST' // Viewers can't POST
        ) as Request;
        const res = mockResponse() as Response;

        mockGetPermissionsByRoleUseCaseInstance.execute.mockResolvedValueOnce([
            HttpStatusCode.OK,
            [{
                id: 'role1', name: 'Viewer', description: 'Viewer role',
                permissions: [{ module_name: 'users', module_id: 1, can_read: true, can_write: false, can_update: false, can_delete: false }]
            }]
        ]);

        await permissionsMiddleware(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(HttpError));
        const error = mockNext.mock.calls[0][0] as HttpError;
        expect(error.statusCode).toBe(HttpStatusCode.FORBIDDEN);
    });

    it('should return 401 if user is not found or has no roles', async () => {
        const req = mockRequest(null, '/api/v1/users', 'GET') as Request; // No user
        const res = mockResponse() as Response;

        await permissionsMiddleware(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(HttpError));
        const error = mockNext.mock.calls[0][0] as HttpError;
        expect(error.statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
    });


    it('should handle errors from GetPermissionsByRoleUseCase', async () => {
        const req = mockRequest(
            { id: 'user1', roles: [{ id: 'role1', name: 'Admin' }] },
            '/api/v1/users',
            'GET'
        ) as Request;
        const res = mockResponse() as Response;

        mockGetPermissionsByRoleUseCaseInstance.execute.mockRejectedValueOnce(new Error("Database error"));

        await permissionsMiddleware(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        const error = mockNext.mock.calls[0][0];
        expect(error.message).toBe("Database error");
    });

    it('should deny access if module name cannot be extracted', async () => {
        const req = mockRequest(
            { id: 'user1', roles: [{ id: 'role1', name: 'Admin' }] },
            '', // Invalid baseUrl
            'GET'
        ) as Request;
        const res = mockResponse() as Response;

        await permissionsMiddleware(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(HttpError));
        const error = mockNext.mock.calls[0][0] as HttpError;
        expect(error.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
        expect(error.message).toContain('Module name not found in URL');
    });

    it('should deny access for unsupported HTTP methods', async () => {
        const req = mockRequest(
            { id: 'user1', roles: [{ id: 'role1', name: 'Admin' }] },
            '/api/v1/users',
            'OPTIONS' // Unsupported method
        ) as Request;
        const res = mockResponse() as Response;

        mockGetPermissionsByRoleUseCaseInstance.execute.mockResolvedValueOnce([
            HttpStatusCode.OK,
            [{
                id: 'role1', name: 'Admin', description: 'Admin role',
                permissions: [{ module_name: 'users', module_id: 1, can_read: true, can_write: true, can_update: true, can_delete: true }]
            }]
        ]);

        await permissionsMiddleware(req, res, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(HttpError));
        const error = mockNext.mock.calls[0][0] as HttpError;
        expect(error.statusCode).toBe(HttpStatusCode.METHOD_NOT_ALLOWED);
        expect(error.message).toContain('Method OPTIONS not supported for permission checking');
    });

});
