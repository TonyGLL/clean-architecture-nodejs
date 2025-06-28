import 'reflect-metadata'; // Required for InversifyJS
import { CreateRoleUseCase, AssignRoleToUserUseCase, GetRolesForUserUseCase, RevokeRoleFromUserUseCase, CreateRoleDTO, AssignRoleToUserDTO } from '../role.use-case';
import { IRoleRepository } from '../../../domain/repositories/role.repository';
import { IUserRepository } from '../../../domain/repositories/auth.repository';
import { IUserRoleRepository } from '../../../domain/repositories/userRole.repository';
import { Role } from '../../../domain/entities/role';
import { User } from '../../../domain/entities/client';
import { UserRole } from '../../../domain/entities/userRole';
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';

// Mocks
const mockRoleRepository: jest.Mocked<IRoleRepository> = {
    createRole: jest.fn(),
    findRoleByName: jest.fn(),
    findRoleById: jest.fn(),
};

const mockUserRepository: jest.Mocked<IUserRepository> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    saveUser: jest.fn(),
    saveUserPassword: jest.fn(),
    updatePassword: jest.fn(),
    // Add other methods if your IUserRepository interface has them and they are used by other use cases being tested indirectly
};

const mockUserRoleRepository: jest.Mocked<IUserRoleRepository> = {
    assignRoleToUser: jest.fn(),
    findRolesByUserId: jest.fn(),
    removeRoleFromUser: jest.fn(),
};

describe('Role Use Cases', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('CreateRoleUseCase', () => {
        const useCase = new CreateRoleUseCase(mockRoleRepository);
        const dto: CreateRoleDTO = { name: 'admin' };

        it('should create a role successfully', async () => {
            mockRoleRepository.findRoleByName.mockResolvedValue(null);
            const newRole = new Role('1', 'admin');
            mockRoleRepository.createRole.mockResolvedValue(newRole);

            const [status, result] = await useCase.execute(dto);

            expect(status).toBe(HttpStatusCode.CREATED);
            expect(result).toEqual({ id: '1', name: 'admin' });
            expect(mockRoleRepository.findRoleByName).toHaveBeenCalledWith('admin');
            expect(mockRoleRepository.createRole).toHaveBeenCalledWith(expect.objectContaining({ name: 'admin' }));
        });

        it('should throw HttpError if role already exists', async () => {
            mockRoleRepository.findRoleByName.mockResolvedValue(new Role('1', 'admin'));
            await expect(useCase.execute(dto)).rejects.toThrow(new HttpError(HttpStatusCode.BAD_REQUEST, 'Role already exists.'));
        });
    });

    describe('AssignRoleToUserUseCase', () => {
        const useCase = new AssignRoleToUserUseCase(mockUserRepository, mockRoleRepository, mockUserRoleRepository);
        const dto: AssignRoleToUserDTO = { userId: 'user1', roleName: 'editor' };
        const mockUser = new User('user1', 'Test', 'User', 'test@example.com', new Date(), '12345');
        const mockRole = new Role('role2', 'editor');

        it('should assign a role to a user successfully', async () => {
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockRoleRepository.findRoleByName.mockResolvedValue(mockRole);
            mockUserRoleRepository.findRolesByUserId.mockResolvedValue([]); // User does not have the role yet
            mockUserRoleRepository.assignRoleToUser.mockResolvedValue(new UserRole('user1', 'role2'));

            const [status, result] = await useCase.execute(dto);

            expect(status).toBe(HttpStatusCode.CREATED);
            expect(result).toEqual({ userId: 'user1', roleId: 'role2' });
            expect(mockUserRepository.findById).toHaveBeenCalledWith('user1');
            expect(mockRoleRepository.findRoleByName).toHaveBeenCalledWith('editor');
            expect(mockUserRoleRepository.assignRoleToUser).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user1', roleId: 'role2' }));
        });

        it('should throw HttpError if user not found', async () => {
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(dto)).rejects.toThrow(new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.'));
        });

        it('should throw HttpError if role not found', async () => {
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockRoleRepository.findRoleByName.mockResolvedValue(null);
            await expect(useCase.execute(dto)).rejects.toThrow(new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found.'));
        });

        it('should throw HttpError if user already has the role', async () => {
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockRoleRepository.findRoleByName.mockResolvedValue(mockRole);
            mockUserRoleRepository.findRolesByUserId.mockResolvedValue([mockRole]); // User already has this role

            await expect(useCase.execute(dto)).rejects.toThrow(new HttpError(HttpStatusCode.BAD_REQUEST, 'User already has this role.'));
        });
    });

    describe('GetRolesForUserUseCase', () => {
        const useCase = new GetRolesForUserUseCase(mockUserRepository, mockUserRoleRepository);
        const mockUser = new User('user1', 'Test', 'User', 'test@example.com', new Date(), '12345');
        const rolesToReturn = [new Role('r1', 'admin'), new Role('r2', 'editor')];

        it('should return roles for a user', async () => {
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockUserRoleRepository.findRolesByUserId.mockResolvedValue(rolesToReturn);

            const [status, result] = await useCase.execute('user1');

            expect(status).toBe(HttpStatusCode.OK);
            expect(result).toEqual([{ id: 'r1', name: 'admin' }, { id: 'r2', name: 'editor' }]);
            expect(mockUserRepository.findById).toHaveBeenCalledWith('user1');
            expect(mockUserRoleRepository.findRolesByUserId).toHaveBeenCalledWith('user1');
        });

        it('should throw HttpError if user not found', async () => {
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute('user1')).rejects.toThrow(new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.'));
        });
    });

    describe('RevokeRoleFromUserUseCase', () => {
        const useCase = new RevokeRoleFromUserUseCase(mockUserRepository, mockRoleRepository, mockUserRoleRepository);
        const mockUser = new User('user1', 'Test', 'User', 'test@example.com', new Date(), '12345');
        const mockRoleToRevoke = new Role('role2', 'editor');

        it('should revoke a role from a user successfully', async () => {
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockRoleRepository.findRoleByName.mockResolvedValue(mockRoleToRevoke);
            mockUserRoleRepository.findRolesByUserId.mockResolvedValue([mockRoleToRevoke]); // User has the role
            mockUserRoleRepository.removeRoleFromUser.mockResolvedValue(undefined);

            const [status, result] = await useCase.execute('user1', 'editor');

            expect(status).toBe(HttpStatusCode.NO_CONTENT);
            expect(result).toEqual({});
            expect(mockUserRoleRepository.removeRoleFromUser).toHaveBeenCalledWith('user1', 'role2');
        });

        it('should throw HttpError if user does not have the role', async () => {
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockRoleRepository.findRoleByName.mockResolvedValue(mockRoleToRevoke);
            mockUserRoleRepository.findRolesByUserId.mockResolvedValue([]); // User does NOT have the role

            await expect(useCase.execute('user1', 'editor')).rejects.toThrow(new HttpError(HttpStatusCode.BAD_REQUEST, 'User does not have this role.'));
        });
    });
});
