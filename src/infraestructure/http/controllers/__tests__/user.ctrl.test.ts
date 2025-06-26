import 'reflect-metadata';
import { Request, Response } from 'express';
import { UserController } from '../user.ctrl';
import { GetUserUseCase, GetUsersUseCase, CreateUserUseCase, UpdateUserUseCase, DeleteUserUseCase } from '../../../../application/use-cases/user.use-case';
import { HttpStatusCode } from '../../../../domain/shared/http.status';
import { HttpError } from '../../../../domain/errors/http.error';
import { CreateUserDTO, UpdateUserDTO } from '../../../../application/dtos/user.dto';

// Mocks for Use Cases
const mockGetUserUseCase: jest.Mocked<GetUserUseCase> = { execute: jest.fn() } as any;
const mockGetUsersUseCase: jest.Mocked<GetUsersUseCase> = { execute: jest.fn() } as any;
const mockCreateUserUseCase: jest.Mocked<CreateUserUseCase> = { execute: jest.fn() } as any;
const mockUpdateUserUseCase: jest.Mocked<UpdateUserUseCase> = { execute: jest.fn() } as any;
const mockDeleteUserUseCase: jest.Mocked<DeleteUserUseCase> = { execute: jest.fn() } as any;

// Mock Express Request and Response
const mockRequest = (body?: any, params?: any, query?: any) => ({
    body,
    params,
    query,
} as Request);

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('UserController', () => {
    let controller: UserController;

    beforeEach(() => {
        controller = new UserController(
            mockGetUserUseCase,
            mockGetUsersUseCase,
            mockCreateUserUseCase,
            mockUpdateUserUseCase,
            mockDeleteUserUseCase
        );
        jest.clearAllMocks();
    });

    describe('getUserById', () => {
        it('should call GetUserUseCase and return a user', async () => {
            const req = mockRequest(null, { id: '1' });
            const res = mockResponse();
            const user = { id: '1', name: 'John Doe' };
            mockGetUserUseCase.execute.mockResolvedValue([HttpStatusCode.OK, user]);

            await controller.getUserById(req, res);

            expect(mockGetUserUseCase.execute).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(res.json).toHaveBeenCalledWith(user);
        });

        it('should handle errors from use case', async () => {
            const req = mockRequest(null, { id: '1' });
            const res = mockResponse();
            mockGetUserUseCase.execute.mockRejectedValue(new HttpError(HttpStatusCode.NOT_FOUND, 'User not found'));

            await controller.getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NOT_FOUND);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });

    describe('getUsers', () => {
        it('should call GetUsersUseCase and return users', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const users = [{ id: '1', name: 'John Doe' }];
            mockGetUsersUseCase.execute.mockResolvedValue([HttpStatusCode.OK, users]);

            await controller.getUsers(req, res);

            expect(mockGetUsersUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(res.json).toHaveBeenCalledWith(users);
        });
    });

    describe('createUser', () => {
        it('should call CreateUserUseCase and return the created user', async () => {
            const userDto: CreateUserDTO = { name: 'John', lastName: 'Doe', email: 'j.doe@example.com', password: '123', birthDate: new Date() };
            const req = mockRequest(userDto);
            const res = mockResponse();
            const createdUser = { id: '1', ...userDto };
            mockCreateUserUseCase.execute.mockResolvedValue([HttpStatusCode.CREATED, createdUser]);

            await controller.createUser(req, res);

            expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(userDto);
            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.CREATED);
            expect(res.json).toHaveBeenCalledWith(createdUser);
        });
    });

    describe('updateUser', () => {
        it('should call UpdateUserUseCase and return the updated user', async () => {
            const userDto: UpdateUserDTO = { name: 'John Updated' };
            const req = mockRequest(userDto, { id: '1' });
            const res = mockResponse();
            const updatedUser = { id: '1', name: 'John Updated' };
            mockUpdateUserUseCase.execute.mockResolvedValue([HttpStatusCode.OK, updatedUser]);

            await controller.updateUser(req, res);

            expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith('1', userDto);
            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(res.json).toHaveBeenCalledWith(updatedUser);
        });
    });

    describe('deleteUser', () => {
        it('should call DeleteUserUseCase and return no content', async () => {
            const req = mockRequest(null, { id: '1' });
            const res = mockResponse();
            mockDeleteUserUseCase.execute.mockResolvedValue([HttpStatusCode.NO_CONTENT, {}]);

            await controller.deleteUser(req, res);

            expect(mockDeleteUserUseCase.execute).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NO_CONTENT);
            expect(res.json).toHaveBeenCalledWith({});
        });
    });
});
