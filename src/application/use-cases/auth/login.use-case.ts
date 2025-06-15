import { inject, injectable } from "inversify";
import { AuthResponseDTO } from "../../dtos/auth.response.dto";
import { LoginUserDTO } from "../../dtos/auth.dto";
import { TYPES } from "../../../infraestructure/ioc/types";
import { IUserRepository } from "../../../domain/repositories/user.repository";
import { IHashingService } from "../../../domain/services/hashing.service";
import { IJwtService } from "../../services/jwt.service";
import { HttpError } from "../../../domain/errors/http.error";
import { HttpStatusCode } from "../../shared/http.status";

@injectable()
export class LoginUseCase {
    constructor(
        @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(TYPES.IHashingService) private hasingService: IHashingService,
        @inject(TYPES.IJwtService) private jwtService: IJwtService
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