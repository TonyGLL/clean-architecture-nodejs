import { inject, injectable } from "inversify";
import { AuthResponseDTO } from "../dtos/auth.response.dto";
import { LoginUserDTO, RegisterUserDTO } from "../dtos/auth.dto";
import { TYPES } from "../../infraestructure/ioc/types";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IHashingService } from "../../domain/services/hashing.service";
import { IJwtService } from "../services/jwt.service";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { User } from "../../domain/entities/user";

@injectable()
export class AuthUseCase {
    constructor(
        @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(TYPES.IHashingService) private hasingService: IHashingService,
        @inject(TYPES.IJwtService) private jwtService: IJwtService
    ) { }

    public async executeLogin(dto: LoginUserDTO): Promise<[number, AuthResponseDTO | object]> {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user || !user.password) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Not found');

        const isPasswordValid = await this.hasingService.compare(dto.password, user.password);
        if (!isPasswordValid) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Bad credentials');

        const token = this.jwtService.generateToken({ id: user.id });

        delete user.password;
        return [HttpStatusCode.OK, { user, token }];
    }

    public async executeRegister(dto: RegisterUserDTO): Promise<[number, object]> {
        const existUser = await this.userRepository.findByEmail(dto.email);
        if (existUser) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'User already exist.');

        const user = new User(null, dto.name, dto.lastName, dto.email, dto.birth_date, dto.phone);

        const newUser = await this.userRepository.saveUser(user);
        if (!newUser) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Db dont exist id.');

        await user.setPassword(dto.password, this.hasingService);
        await this.userRepository.saveUserPassword(newUser.id!, user.password!);

        const token = this.jwtService.generateToken({ id: newUser.id });

        return [HttpStatusCode.CREATED, { token, user }];
    }

    public async executeRestorePassword(email: string): Promise<[number, object]> {
        const existUser = await this.userRepository.findByEmail(email);
        if (!existUser) throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');

        return [HttpStatusCode.OK, { message: 'Email sended successfully.' }];
    }
}