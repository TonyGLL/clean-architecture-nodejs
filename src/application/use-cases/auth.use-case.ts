import { inject, injectable } from "inversify";
import { logger } from "../../infraestructure/config/winston";
import { AuthClientResponseDTO, LoginClientDTO, RegisterClientDTO, RestorePasswordDTO } from "../dtos/auth.client.dto";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { APPLICATION_TYPES } from "../ioc.types";
import { IAuthRepository } from "../../domain/repositories/auth.repository";
import { IHashingService } from "../../domain/services/hashing.service";
import { IJwtService } from "../services/jwt.service";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { Client } from "../../domain/entities/client";
import { IMailService } from "../../domain/services/mail.service";
import { Pool } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../infraestructure/ioc/types";
import { ServiceType } from "../dtos/auth.admin.dto";
import { User } from "../../domain/entities/user";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { Role } from "../../domain/entities/role";
import { ICartRepository } from "../../domain/repositories/cart.repository";

@injectable()
export class LoginUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IAuthRepository) private authRepository: IAuthRepository,
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hasingService: IHashingService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: LoginClientDTO, type: ServiceType): Promise<[number, AuthClientResponseDTO | object]> {
        logger.info(`[LoginUseCase] - Starting login for ${type} with email: ${dto.email}`);
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            let user: Client | User | null = null;
            switch (type) {
                case 'admin':
                    user = await this.userRepository.findByEmail(dto.email);
                    break;
                case 'client':
                    user = await this.authRepository.findByEmail(dto.email, client);
                    break;
                default:
                    throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Invalid login type');
            }

            if (!user || !user.password) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Bad credentials');

            const isPasswordValid = await this.hasingService.compare(dto.password, user.password);
            if (!isPasswordValid) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Bad credentials');

            const tokenObject: { id: number | null; roles?: number[] } = { id: user.id };
            if (type === 'admin' && user instanceof User) tokenObject['roles'] = user.roles.map((role: Role) => Number.parseInt(role.id!)); // Assuming User has a role property

            const token = this.jwtService.generateToken(tokenObject, '1h', type);

            delete user.password;

            const response: { user: User | Client; token: string; cartId?: number } = { user, token };

            if (type === 'client' && user instanceof Client && user.id) {
                await this.cartRepository.createCartFromLogin(user.id, client);
                await this.authRepository.updateLastAccess(user.id!, client);
            } else {
                await this.userRepository.updateLastAccess(user.id!, client);
            }

            await client.query('COMMIT');

            return [HttpStatusCode.OK, response];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`[LoginUseCase] - Error during login for ${type} with email: ${dto.email}`, { error });
            throw error instanceof HttpError ? error : new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown error');
        } finally {
            client.release();
        }
    }
}

@injectable()
export class RegisterClientUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IAuthRepository) private authClientRepository: IAuthRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hasingService: IHashingService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: RegisterClientDTO): Promise<[number, object]> {
        logger.info(`[RegisterClientUseCase] - Starting registration for email: ${dto.email}`);
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const existClient = await this.authClientRepository.findByEmail(dto.email, client);
            if (existClient) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Client already exist.');

            const userClient = new Client(null, dto.name, dto.lastName, dto.email, dto.birth_date, dto.phone);

            const userClientSaved = await this.authClientRepository.saveClient(userClient, client);
            if (!userClientSaved) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Db dont exist id.');

            await userClient.setPassword(dto.password, this.hasingService);
            await this.authClientRepository.saveClientPassword(userClientSaved.id!, userClient.password!, client);

            await client.query('COMMIT');

            const token = this.jwtService.generateToken({ id: userClientSaved.id }, '1h', 'client');

            const newUser = new Client(userClientSaved.id, userClientSaved.name, userClientSaved.last_name, userClientSaved.email, userClientSaved.birth_date, userClientSaved.phone);
            if (!userClientSaved.id) throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Saved Client ID missing');

            return [HttpStatusCode.CREATED, { token, userClient: newUser }];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`[RegisterClientUseCase] - Error during registration for email: ${dto.email}`, { error });
            throw error instanceof HttpError ? error : new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown error');
        } finally {
            client.release();
        }
    }
}

@injectable()
export class SendEmailUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IAuthRepository) private authClientRepository: IAuthRepository,
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IMailService) private mailService: IMailService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(email: string, type: ServiceType): Promise<[number, object]> {
        logger.info(`[SendEmailUseCase] - Starting send email for ${type} with email: ${email}`);
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            let existUser: User | Client | null = null;
            if (type === 'admin') {
                existUser = await this.userRepository.findByEmail(email);
            } else {
                existUser = await this.authClientRepository.findByEmail(email, client);
            }

            if (!existUser) throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');

            const token = this.jwtService.generateToken({ id: existUser.id }, '15m', type);

            await this.mailService.sendRestorePasswordEmail(email, token); // Pass token

            await client.query('COMMIT');

            return [HttpStatusCode.OK, { message: 'Email sended successfully.' }];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`[SendEmailUseCase] - Error during send email for ${type} with email: ${email}`, { error });
            throw error instanceof HttpError ? error : new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown error');
        } finally {
            client.release();
        }
    }
}

@injectable()
export class RestorePasswordUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IAuthRepository) private authClientRepository: IAuthRepository,
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService,
        @inject(DOMAIN_TYPES.IHashingService) private hashingService: IHashingService,
        @inject(DOMAIN_TYPES.IMailService) private mailService: IMailService,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: RestorePasswordDTO, type: ServiceType): Promise<[number, object]> {
        logger.info(`[RestorePasswordUseCase] - Starting restore password for ${type} with email: ${dto.email}`);
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            let existUser: User | Client | null = null;
            if (type === 'admin') {
                existUser = await this.userRepository.findByEmail(dto.email);
            } else {
                existUser = await this.authClientRepository.findByEmail(dto.email, client);
            }

            if (!existUser || !existUser.id) throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');

            this.jwtService.validateToken(dto.token, type);

            const password = await this.hashingService.hash(dto.password);

            if (type === 'admin') {
                await this.userRepository.updatePassword(existUser.id, password, client);
            } else {
                await this.authClientRepository.updatePassword(existUser.id, password);
            }

            await client.query('COMMIT');

            await this.mailService.sendPasswordChangedEmail(dto.email);

            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`[RestorePasswordUseCase] - Error during restore password for ${type} with email: ${dto.email}`, { error });
            throw error instanceof HttpError ? error : new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown error');
        } finally {
            client.release();
        }
    }
}