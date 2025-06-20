import 'reflect-metadata'; // Required for InversifyJS
import { Request, Response } from 'express';
import { RoleController } from '../role.ctrl';
import { CreateRoleUseCase, AssignRoleToUserUseCase, GetRolesForUserUseCase, RevokeRoleFromUserUseCase, CreateRoleDTO } from '../../../../application/use-cases/role.use-case';
import { HttpStatusCode } from '../../../../domain/shared/http.status';
import { HttpError } from '../../../../domain/errors/http.error';

// Mocks for Use Cases
const mockCreateRoleUseCase: jest.Mocked<CreateRoleUseCase> = {
    execute: jest.fn(),
} as any; // Cast to any for simplicity if constructor not needed for mock

const mockAssignRoleToUserUseCase: jest.Mocked<AssignRoleToUserUseCase> = {
    execute: jest.fn(),
} as any;

const mockGetRolesForUserUseCase: jest.Mocked<GetRolesForUserUseCase> = {
    execute: jest.fn(),
} as any;

const mockRevokeRoleFromUserUseCase: jest.Mocked<RevokeRoleFromUserUseCase> = {
    execute: jest.fn(),
} as any;

// Mock Express Request and Response
const mockRequest = (body?: any, params?: any) => ({
    body,
    params,
} as Request);

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('RoleController', () => {
    let controller: RoleController;

    beforeEach(() => {
        // Create a new controller instance for each test, injecting mocks
        controller = new RoleController(
            mockCreateRoleUseCase,
            mockAssignRoleToUserUseCase,
            mockGetRolesForUserUseCase,
            mockRevokeRoleFromUserUseCase
        );
        jest.clearAllMocks();
    });

    describe('createRole', () => {
        it('should call CreateRoleUseCase and return its result', async () => {
            const req = mockRequest({ name: 'new_role' } as CreateRoleDTO);
            const res = mockResponse();
            const expectedResult = { id: '1', name: 'new_role' };
            mockCreateRoleUseCase.execute.mockResolvedValue([HttpStatusCode.CREATED, expectedResult]);

            await controller.createRole(req, res);

            expect(mockCreateRoleUseCase.execute).toHaveBeenCalledWith({ name: 'new_role' });
            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.CREATED);
            expect(res.json).toHaveBeenCalledWith(expectedResult);
        });

        it('should handle HttpError from use case', async () => {
            const req = mockRequest({ name: 'fail_role' });
            const res = mockResponse();
            mockCreateRoleUseCase.execute.mockRejectedValue(new HttpError(HttpStatusCode.BAD_REQUEST, 'Role exists'));

            await controller.createRole(req, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
            expect(res.json).toHaveBeenCalledWith({ message: 'Role exists' });
        });

        it('should handle generic error from use case', async () => {
            const req = mockRequest({ name: 'generic_fail' });
            const res = mockResponse();
            mockCreateRoleUseCase.execute.mockRejectedValue(new Error('Something went wrong'));

            await controller.createRole(req, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.INTERNAL_SERVER_ERROR);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('assignRoleToUser', () => {
        it('should call AssignRoleToUserUseCase and return its result', async () => {
            const req = mockRequest({ roleName: 'editor' }, { userId: 'user123' });
            const res = mockResponse();
            const expectedResult = { userId: 'user123', roleId: 'role456' };
            mockAssignRoleToUserUseCase.execute.mockResolvedValue([HttpStatusCode.CREATED, expectedResult]);

            await controller.assignRoleToUser(req, res);

            expect(mockAssignRoleToUserUseCase.execute).toHaveBeenCalledWith({ userId: 'user123', roleName: 'editor' });
            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.CREATED);
            expect(res.json).toHaveBeenCalledWith(expectedResult);
        });
    });

    describe('getRolesForUser', () => {
        it('should call GetRolesForUserUseCase and return roles', async () => {
            const req = mockRequest(null, { userId: 'user1' });
            const res = mockResponse();
            const roles = [{ id: 'r1', name: 'viewer' }];
            mockGetRolesForUserUseCase.execute.mockResolvedValue([HttpStatusCode.OK, roles]);

            await controller.getRolesForUser(req, res);

            expect(mockGetRolesForUserUseCase.execute).toHaveBeenCalledWith('user1');
            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(res.json).toHaveBeenCalledWith(roles);
        });
    });

    describe('revokeRoleFromUser', () => {
        it('should call RevokeRoleFromUserUseCase and return no content', async () => {
            const req = mockRequest(null, { userId: 'user1', roleName: 'editor' });
            const res = mockResponse();
            mockRevokeRoleFromUserUseCase.execute.mockResolvedValue([HttpStatusCode.NO_CONTENT, {}]);

            await controller.revokeRoleFromUser(req, res);

            expect(mockRevokeRoleFromUserUseCase.execute).toHaveBeenCalledWith('user1', 'editor');
            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NO_CONTENT);
            expect(res.json).toHaveBeenCalledWith({});
        });
    });
});
