import { inject, injectable } from "inversify";
import { LoginUserDTO } from "../../dtos/auth.dto";

@injectable()
export class RegisterUseCase {
    constructor(
    ) { }

    public async execute(dto: LoginUserDTO): Promise<any> {

    }
}