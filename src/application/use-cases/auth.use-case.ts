import { inject, injectable } from "inversify";
import { AuthResponseDTO } from "../dtos/auth.response.dto";
import { LoginUserDTO, RegisterUserDTO } from "../dtos/auth.dto";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { APPLICATION_TYPES } from "../ioc.types";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IHashingService } from "../../domain/services/hashing.service";
import { IJwtService } from "../services/jwt.service";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { User } from "../../domain/entities/user";
import { IMailService } from "../../domain/services/mail.service";
import { v4 as uuidv4 } from 'uuid'; // Import uuid

@injectable()
export class LoginUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hasingService: IHashingService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService
    ) { }

    public async execute(dto: LoginUserDTO): Promise<[number, AuthResponseDTO | object]> {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user || !user.password) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Not found');

        const isPasswordValid = await this.hasingService.compare(dto.password, user.password);
        if (!isPasswordValid) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Bad credentials');

        const token = this.jwtService.generateToken({ id: user.id });

        delete user.password;
        return [HttpStatusCode.OK, { user, token }];
    }
}

@injectable()
export class RegisterUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IHashingService) private hasingService: IHashingService,
        @inject(APPLICATION_TYPES.IJwtService) private jwtService: IJwtService
    ) { }

    public async execute(dto: RegisterUserDTO): Promise<[number, object]> {
        const existUser = await this.userRepository.findByEmail(dto.email);
        if (existUser) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'User already exist.');

        const user = new User(null, dto.name, dto.lastName, dto.email, dto.birth_date, dto.phone);

        const userSaved = await this.userRepository.saveUser(user);
        if (!userSaved) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Db dont exist id.');

        await user.setPassword(dto.password, this.hasingService);
        await this.userRepository.saveUserPassword(userSaved.id!, user.password!);

        const token = this.jwtService.generateToken({ id: userSaved.id });

        const newUser = new User(userSaved.id, userSaved.name, userSaved.last_name, userSaved.email, userSaved.birth_date, userSaved.phone);

        return [HttpStatusCode.CREATED, { token, user: newUser }];
    }
}

@injectable()
export class RestorePasswordUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IMailService) private mailService: IMailService
    ) { }

    public async execute(email: string): Promise<[number, object]> {
        const existUser = await this.userRepository.findByEmail(email);
        if (!existUser) throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');

        const token = uuidv4(); // Generate token

        // In a real application, you would save the token with user ID and expiry
        // For example: await this.passwordResetRepository.createToken(existUser.id, token, expiryDate);

        await this.mailService.sendRestorePasswordEmail(email, token); // Pass token

        return [HttpStatusCode.OK, { message: 'Email sended successfully.' }];
    }
}