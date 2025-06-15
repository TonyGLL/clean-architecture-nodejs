import { inject, injectable } from "inversify";
import { RegisterUserDTO } from "../../dtos/auth.dto";
import { IUserRepository } from "../../../domain/repositories/user.repository";
import { IHashingService } from "../../../domain/services/hashing.service";
import { TYPES } from "../../../infraestructure/ioc/types";
import { IJwtService } from "../../services/jwt.service";
import { HttpStatusCode } from "../../shared/http.status";
import { HttpError } from "../../../domain/errors/http.error";
import { User } from "../../../domain/entities/user";

@injectable()
export class RegisterUseCase {
    constructor(
        @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(TYPES.IHashingService) private hasingService: IHashingService,
        @inject(TYPES.IJwtService) private jwtService: IJwtService
    ) { }

    public async execute(dto: RegisterUserDTO): Promise<[number, object]> {
        const existUser = await this.userRepository.findByEmail(dto.email);
        if (existUser) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'User already exist.');

        const user = new User(null, dto.name, dto.lastName, dto.email, dto.role, dto.age, dto.phone);

        const newUser = await this.userRepository.saveUser(user);
        if (!newUser) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Db dont exist id.');

        await user.setPassword(dto.password, this.hasingService);
        await this.userRepository.saveUserPassword(newUser.id!, user.password!);

        const token = this.jwtService.generateToken({ id: newUser.id });

        return [HttpStatusCode.CREATED, { token, user }];
    }
}