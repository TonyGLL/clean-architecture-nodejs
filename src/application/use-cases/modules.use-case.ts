import { HttpStatusCode } from './../../domain/shared/http.status';
import { inject, injectable } from "inversify";
import { GetAllModulesResponseDTO } from "../dtos/modules.dto";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IModulesRepository } from "../../domain/repositories/modules.repository";

@injectable()
export class GetAllModulesUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IModulesRepository) private modulesRepository: IModulesRepository
    ) { }

    public async execute(): Promise<[number, GetAllModulesResponseDTO]> {
        return [HttpStatusCode.OK, await this.modulesRepository.getAllModules()];
    }
}