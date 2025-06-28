import 'reflect-metadata';
import { GetUserDetailsUseCase, GetUsersUseCase, CreateUserUseCase, UpdateUserUseCase, DeleteUserUseCase } from '../user.use-case';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/entities/user';
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';
import { CreateUserDTO, UpdateUserDTO } from '../../dtos/user.dto';

// Mocks
const mockUserRepository: jest.Mocked<IUserRepository> = {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

describe('User Use Cases', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GetUserUseCase', () => {
        const useCase = new GetUserDetailsUseCase(mockUserRepository);
        const mockUser = new User('1', 'John', 'Doe', 'john.doe@example.com', new Date(), 'password123');

        it('should return a user successfully', async () => {
            mockUserRepository.findById.mockResolvedValue(mockUser);

            const [status, result] = await useCase.execute('1');

            expect(status).toBe(HttpStatusCode.OK);
            expect(result.id).toBe('1');
            expect(result.email).toBe('john.doe@example.com');
            expect(mockUserRepository.findById).toHaveBeenCalledWith('1');
        });

        it('should throw HttpError if user not found', async () => {
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute('1')).rejects.toThrow(new HttpError(HttpStatusCode.NOT_FOUND, 'User not found'));
        });
    });

    describe('GetUsersUseCase', () => {
        const useCase = new GetUsersUseCase(mockUserRepository);
        const mockUsers = [
            new User('1', 'John', 'Doe', 'john.doe@example.com', new Date(), 'pass1'),
            new User('2', 'Jane', 'Doe', 'jane.doe@example.com', new Date(), 'pass2'),
        ];

        it('should return a list of users', async () => {
            mockUserRepository.findAll.mockResolvedValue(mockUsers);

            const [status, result] = await useCase.execute();

            expect(status).toBe(HttpStatusCode.OK);
            expect(result).toHaveLength(2);
            expect(result[0].email).toBe('john.doe@example.com');
            expect(mockUserRepository.findAll).toHaveBeenCalled();
        });
    });

    describe('CreateUserUseCase', () => {
        const useCase = new CreateUserUseCase(mockUserRepository);
        const dto: CreateUserDTO = {
            name: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123',
            birth_date: new Date('1990-01-01'),
        };
        const createdUser = new User('1', dto.name, dto.lastName, dto.email, dto.birth_date, dto.password);

        it('should create a user successfully', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);
            mockUserRepository.create.mockResolvedValue(createdUser);

            const [status, result] = await useCase.execute(dto);

            expect(status).toBe(HttpStatusCode.CREATED);
            expect(result.email).toBe(dto.email);
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);
            expect(mockUserRepository.create).toHaveBeenCalled();
        });

        it('should throw HttpError if email already exists', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(createdUser);
            await expect(useCase.execute(dto)).rejects.toThrow(new HttpError(HttpStatusCode.BAD_REQUEST, 'Email already exists'));
        });
    });

    describe('UpdateUserUseCase', () => {
        const useCase = new UpdateUserUseCase(mockUserRepository);
        const userId = '1';
        const dto: UpdateUserDTO = { name: 'John Updated' };
        const existingUser = new User(userId, 'John', 'Doe', 'john.doe@example.com', new Date(), 'pass');
        const updatedUser = { ...existingUser, ...dto };

        it('should update a user successfully', async () => {
            mockUserRepository.findById.mockResolvedValue(existingUser);
            mockUserRepository.update.mockResolvedValue(updatedUser);

            const [status, result] = await useCase.execute(userId, dto);

            expect(status).toBe(HttpStatusCode.OK);
            expect(result.name).toBe('John Updated');
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
            expect(mockUserRepository.update).toHaveBeenCalledWith(userId, dto);
        });

        it('should throw HttpError if user not found', async () => {
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(userId, dto)).rejects.toThrow(new HttpError(HttpStatusCode.NOT_FOUND, 'User not found'));
        });

        it('should throw HttpError if updated email already exists for another user', async () => {
            const updateDtoWithEmail: UpdateUserDTO = { email: 'another@example.com' };
            const userWithThatEmail = new User('2', 'Jane', 'Doe', 'another@example.com', new Date(), 'pass');
            mockUserRepository.findById.mockResolvedValue(existingUser);
            mockUserRepository.findByEmail.mockResolvedValue(userWithThatEmail);

            await expect(useCase.execute(userId, updateDtoWithEmail)).rejects.toThrow(new HttpError(HttpStatusCode.BAD_REQUEST, 'Email already in use by another user'));
        });
    });

    describe('DeleteUserUseCase', () => {
        const useCase = new DeleteUserUseCase(mockUserRepository);
        const userId = '1';
        const existingUser = new User(userId, 'John', 'Doe', 'john.doe@example.com', new Date(), 'pass');

        it('should delete a user successfully', async () => {
            mockUserRepository.findById.mockResolvedValue(existingUser);
            mockUserRepository.delete.mockResolvedValue(undefined);

            const [status, result] = await useCase.execute(userId);

            expect(status).toBe(HttpStatusCode.NO_CONTENT);
            expect(result).toEqual({});
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
            expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
        });

        it('should throw HttpError if user not found', async () => {
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(userId)).rejects.toThrow(new HttpError(HttpStatusCode.NOT_FOUND, 'User not found'));
        });
    });
});
