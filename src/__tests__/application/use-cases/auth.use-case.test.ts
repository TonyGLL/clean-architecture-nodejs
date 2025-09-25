import 'reflect-metadata';
import { RegisterClientUseCase } from '../../../application/use-cases/auth.use-case';
import { IAuthRepository } from '../../../domain/repositories/auth.repository';
import { IHashingService } from '../../../domain/services/hashing.service';
import { IJwtService } from '../../../application/services/jwt.service';
import { Pool, PoolClient } from 'pg';
import { RegisterClientDTO } from '../../../application/dtos/auth.client.dto';
import { Client } from '../../../domain/entities/client';
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';

describe('RegisterClientUseCase', () => {
    let registerClientUseCase: RegisterClientUseCase;
    let mockAuthRepository: jest.Mocked<IAuthRepository>;
    let mockHashingService: jest.Mocked<IHashingService>;
    let mockJwtService: jest.Mocked<IJwtService>;
    let mockPool: jest.Mocked<Pool>;
    let mockPoolClient: jest.Mocked<PoolClient>;

    beforeEach(() => {
        mockAuthRepository = {
            findByEmail: jest.fn(),
            saveClient: jest.fn(),
            saveClientPassword: jest.fn(),
            updatePassword: jest.fn(),
            updateLastAccess: jest.fn(),
        };

        mockHashingService = {
            hash: jest.fn(),
            compare: jest.fn(),
        };

        mockJwtService = {
            generateToken: jest.fn(),
            validateToken: jest.fn(),
        };

        mockPoolClient = {
            query: jest.fn().mockResolvedValue(undefined),
            release: jest.fn(),
        } as any;

        mockPool = {
            connect: jest.fn().mockResolvedValue(mockPoolClient),
        } as any;

        registerClientUseCase = new RegisterClientUseCase(
            mockAuthRepository,
            mockHashingService,
            mockJwtService,
            mockPool
        );
    });

    it('should register a new client successfully', async () => {
        const dto: RegisterClientDTO = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test',
            lastName: 'User',
            birth_date: new Date('1990-01-01'),
            phone: '1234567890',
        };

        const savedClient = new Client(1, dto.name, dto.lastName, dto.email, dto.birth_date, dto.phone);

        mockAuthRepository.findByEmail.mockResolvedValue(null);
        mockAuthRepository.saveClient.mockResolvedValue(savedClient);
        mockHashingService.hash.mockResolvedValue('hashed_password');
        mockJwtService.generateToken.mockReturnValue('test_token');

        const [statusCode, result] = await registerClientUseCase.execute(dto);

        expect(statusCode).toBe(HttpStatusCode.CREATED);
        expect(result).toHaveProperty('token', 'test_token');
        expect(result).toHaveProperty('userClient');
        expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(dto.email, mockPoolClient);
        expect(mockAuthRepository.saveClient).toHaveBeenCalled();
        expect(mockAuthRepository.saveClientPassword).toHaveBeenCalled();
        expect(mockPoolClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockPoolClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw an error if the client already exists', async () => {
        const dto: RegisterClientDTO = {
            email: 'existing@example.com',
            password: 'password123',
            name: 'Existing',
            lastName: 'User',
            birth_date: new Date('1990-01-01'),
            phone: '1234567890',
        };

        const existingClient = new Client(1, dto.name, dto.lastName, dto.email, dto.birth_date, dto.phone);

        mockAuthRepository.findByEmail.mockResolvedValue(existingClient);

        await expect(registerClientUseCase.execute(dto)).rejects.toThrow(
            new HttpError(HttpStatusCode.BAD_REQUEST, 'Client already exist.')
        );

        expect(mockPoolClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockPoolClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
});
