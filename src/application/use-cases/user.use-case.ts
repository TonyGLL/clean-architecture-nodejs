import { inject, injectable } from 'inversify';
import { Pool } from 'pg';
import { DOMAIN_TYPES } from '../../domain/ioc.types';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IUserRoleRepository } from '../../domain/repositories/userRole.repository';
import { IHashingService } from '../../domain/services/hashing.service';
import { HttpError } from '../../domain/errors/http.error';
import { HttpStatusCode } from '../../domain/shared/http.status';
import { User } from '../../domain/entities/user';
import { INFRASTRUCTURE_TYPES } from '../../infraestructure/ioc/types';
import { AssignRoleDTO, ChangePasswordDTO, CreateUserDTO, GetUsersDTO, GetUsersResponseDTO, UpdateUserDTO } from '../dtos/user.dto';
import { UserRole } from '../../domain/entities/userRole';

@injectable()
export class GetUsersUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository
    ) { }

    public async execute(dto: GetUsersDTO): Promise<[number, GetUsersResponseDTO]> {
        const users = await this.userRepository.getUsers(dto);
        return [HttpStatusCode.OK, users];
    }
}

@injectable()
export class CreateUserUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hashingService: IHashingService,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: CreateUserDTO): Promise<[number, User]> {
        if (!dto.password) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Password is required');
        }

        const existingUser = await this.userRepository.findByEmail(dto.email);
        if (existingUser) {
            throw new HttpError(HttpStatusCode.CONFLICT, 'User with this email already exists');
        }

        const hashedPassword = await this.hashingService.hash(dto.password);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const userEntity = new User(null, dto.name, dto.lastName, dto.email, dto.birthDate, dto.phone);
            const newUser = await this.userRepository.create(userEntity, client);
            if (!newUser.id) {
                throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Error creating user');
            }
            await this.userRepository.updatePassword(newUser.id, hashedPassword, client);
            await client.query('COMMIT');
            return [HttpStatusCode.CREATED, newUser];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

@injectable()
export class UpdateUserUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(id: number, dto: UpdateUserDTO): Promise<[number, object]> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await this.userRepository.update(id, dto, client);
            await client.query('COMMIT');
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

@injectable()
export class DeleteUserUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(id: number): Promise<[number, object]> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await this.userRepository.delete(id, client);
            await client.query('COMMIT');
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

@injectable()
export class ChangePasswordUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hashingService: IHashingService,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(id: number, dto: ChangePasswordDTO): Promise<[number, object]> {
        if (!dto.newPassword) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, 'New password is required');
        }
        const hashedPassword = await this.hashingService.hash(dto.newPassword);
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await this.userRepository.updatePassword(id, hashedPassword, client);
            await client.query('COMMIT');
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

@injectable()
export class AssignRoleToUserUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRoleRepository) private userRoleRepository: IUserRoleRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(userId: number, dto: AssignRoleDTO): Promise<[number, object]> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const userRole = new UserRole(userId.toString(), dto.roleId.toString());
            await this.userRoleRepository.assignRoleToUser(userRole, client);
            await client.query('COMMIT');
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
