import { inject, injectable } from "inversify";
import { AuthClientResponseDTO, LoginClientDTO, RegisterClientDTO, RestorePasswordDTO } from "../dtos/auth.client.dto";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { APPLICATION_TYPES } from "../ioc.types";
import { IAuthClientRepository } from "../../domain/repositories/auth.client.repository";
import { IHashingService } from "../../domain/services/hashing.service";
import { IJwtService } from "../services/jwt.service";
import { IUserRoleRepository } from "../../domain/repositories/userRole.repository";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { Client } from "../../domain/entities/client";
import { IMailService } from "../../domain/services/mail.service";
import { Pool } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../infraestructure/ioc/types";

@injectable()
export class LoginClientUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IAuthClientRepository) private authClientRepository: IAuthClientRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hasingService: IHashingService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService
    ) { }

    public async execute(dto: LoginClientDTO): Promise<[number, AuthClientResponseDTO | object]> {
        const client = await this.authClientRepository.findByEmail(dto.email);
        if (!client || !client.password) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Bad credentials');

        const isPasswordValid = await this.hasingService.compare(dto.password, client.password);
        if (!isPasswordValid) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Bad credentials');

        const token = this.jwtService.generateToken({ id: client.id }, '1h');

        delete client.password;

        return [HttpStatusCode.OK, { client, token }];
    }
}

@injectable()
export class RegisterClientUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IAuthClientRepository) private authClientRepository: IAuthClientRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hasingService: IHashingService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService,
        @inject(DOMAIN_TYPES.IUserRoleRepository) private userRoleRepository: IUserRoleRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: RegisterClientDTO): Promise<[number, object]> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const existClient = await this.authClientRepository.findByEmail(dto.email);
            if (existClient) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Client already exist.');

            const userClient = new Client(null, dto.name, dto.lastName, dto.email, dto.birth_date, dto.phone);

            const userClientSaved = await this.authClientRepository.saveClient(userClient, client);
            if (!userClientSaved) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Db dont exist id.');

            await userClient.setPassword(dto.password, this.hasingService);
            await this.authClientRepository.saveClientPassword(userClientSaved.id!, userClient.password!, client);

            await client.query('COMMIT');

            const token = this.jwtService.generateToken({ id: userClientSaved.id }, '1h');

            const newUser = new Client(userClientSaved.id, userClientSaved.name, userClientSaved.last_name, userClientSaved.email, userClientSaved.birth_date, userClientSaved.phone);
            if (!userClientSaved.id) throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Saved Client ID missing');

            return [HttpStatusCode.CREATED, { token, userClient: newUser }];
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
export class SendEmailClientUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IAuthClientRepository) private authClientRepository: IAuthClientRepository,
        @inject(DOMAIN_TYPES.IMailService) private mailService: IMailService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService
    ) { }

    public async execute(email: string): Promise<[number, object]> {
        const existUser = await this.authClientRepository.findByEmail(email);
        if (!existUser) throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');

        const token = this.jwtService.generateToken({ id: existUser.id }, '2m');

        await this.mailService.sendRestorePasswordEmail(email, token); // Pass token

        return [HttpStatusCode.OK, { message: 'Email sended successfully.' }];
    }
}

@injectable()
export class RestorePasswordClientUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IAuthClientRepository) private authClientRepository: IAuthClientRepository,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService,
        @inject(DOMAIN_TYPES.IHashingService) private hashingService: IHashingService,
    ) { }

    public async execute(dto: RestorePasswordDTO): Promise<[number, object]> {
        const existUser = await this.authClientRepository.findByEmail(dto.email);
        if (!existUser || !existUser.id) throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');

        this.jwtService.validateToken(dto.token);

        const password = await this.hashingService.hash(dto.password);

        await this.authClientRepository.updatePassword(existUser.id, password);

        return [HttpStatusCode.NO_CONTENT, {}];
    }
}