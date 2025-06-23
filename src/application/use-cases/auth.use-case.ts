import { inject, injectable } from "inversify";
import { AuthResponseDTO, LoginUserDTO, RegisterUserDTO, RestorePasswordDTO } from "../dtos/auth.dto";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { APPLICATION_TYPES } from "../ioc.types";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IHashingService } from "../../domain/services/hashing.service";
import { IJwtService } from "../services/jwt.service";
import { IUserRoleRepository } from "../../domain/repositories/userRole.repository";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { User } from "../../domain/entities/user";
import { IMailService } from "../../domain/services/mail.service";
import { Pool } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../infraestructure/ioc/types";

@injectable()
export class LoginUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hasingService: IHashingService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService,
        @inject(DOMAIN_TYPES.IUserRoleRepository) private userRoleRepository: IUserRoleRepository
    ) { }

    public async execute(dto: LoginUserDTO): Promise<[number, AuthResponseDTO | object]> {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user || !user.password) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Not found');

        const isPasswordValid = await this.hasingService.compare(dto.password, user.password);
        if (!isPasswordValid) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Bad credentials');

        const token = this.jwtService.generateToken({ id: user.id }, '1h');

        delete user.password;

        return [HttpStatusCode.OK, { user, token }];
    }
}

@injectable()
export class RegisterUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hasingService: IHashingService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService,
        @inject(DOMAIN_TYPES.IUserRoleRepository) private userRoleRepository: IUserRoleRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: RegisterUserDTO): Promise<[number, object]> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const existUser = await this.userRepository.findByEmail(dto.email);
            if (existUser) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'User already exist.');

            const user = new User(null, dto.name, dto.lastName, dto.email, dto.birth_date, dto.phone);

            const userSaved = await this.userRepository.saveUser(user, client);
            if (!userSaved) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Db dont exist id.');

            await user.setPassword(dto.password, this.hasingService);
            await this.userRepository.saveUserPassword(userSaved.id!, user.password!, client);

            await client.query('COMMIT');

            const token = this.jwtService.generateToken({ id: userSaved.id }, '1h');

            const newUser = new User(userSaved.id, userSaved.name, userSaved.last_name, userSaved.email, userSaved.birth_date, userSaved.phone);
            if (!userSaved.id) throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Saved User ID missing');

            return [HttpStatusCode.CREATED, { token, user: newUser }];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in CreateUser:', error);
            throw error instanceof HttpError ? error : new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown error');
        } finally {
            client.release();
        }
    }
}

@injectable()
export class SendEmailUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IMailService) private mailService: IMailService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService
    ) { }

    public async execute(email: string): Promise<[number, object]> {
        const existUser = await this.userRepository.findByEmail(email);
        if (!existUser) throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');

        const token = this.jwtService.generateToken({ id: existUser.id }, '2m');

        await this.mailService.sendRestorePasswordEmail(email, token); // Pass token

        return [HttpStatusCode.OK, { message: 'Email sended successfully.' }];
    }
}

@injectable()
export class RestorePasswordUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService,
        @inject(DOMAIN_TYPES.IHashingService) private hashingService: IHashingService,
    ) { }

    public async execute(dto: RestorePasswordDTO): Promise<[number, object]> {
        const existUser = await this.userRepository.findByEmail(dto.email);
        if (!existUser || !existUser.id) throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');

        this.jwtService.validateToken(dto.token);

        const password = await this.hashingService.hash(dto.password);

        await this.userRepository.updatePassword(existUser.id, password);

        return [HttpStatusCode.NO_CONTENT, {}];
    }
}