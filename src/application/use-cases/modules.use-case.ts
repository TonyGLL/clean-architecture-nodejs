import { HttpError } from './../../domain/errors/http.error';
import { HttpStatusCode } from './../../domain/shared/http.status';
import { inject, injectable } from "inversify";
import { GetAllModulesResponseDTO } from "../dtos/modules.dto";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IModulesRepository } from "../../domain/repositories/modules.repository";
import { Module } from '../../domain/entities/module';

@injectable()
export class GetAllModulesUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IModulesRepository) private modulesRepository: IModulesRepository
    ) { }

    public async execute(): Promise<[number, GetAllModulesResponseDTO]> {
        return [HttpStatusCode.OK, await this.modulesRepository.getAllModules()];
    }
}

@injectable()
export class GetModuleByIdUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IModulesRepository) private modulesRepository: IModulesRepository
    ) { }

    public async execute(id: string): Promise<[number, Module]> {
        const module = await this.modulesRepository.getModuleById(id);
        return [HttpStatusCode.OK, module];
    }
}

@injectable()
export class CreateModuleUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IModulesRepository) private modulesRepository: IModulesRepository
    ) { }

    public async execute(module: Omit<Module, 'id'>): Promise<[number, Module]> {
        const exist = await this.modulesRepository.getModuleByName(module.name);
        if (exist) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Module already exists');
        const newModule = await this.modulesRepository.createModule(module);
        return [HttpStatusCode.CREATED, newModule];
    }
}

@injectable()
export class UpdateModuleUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IModulesRepository) private modulesRepository: IModulesRepository
    ) { }

    public async execute(id: string, module: Omit<Module, 'id'>): Promise<[number, Module]> {
        const exist = await this.modulesRepository.getModuleById(id);
        if (!exist) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Module not found');
        const updatedModule = await this.modulesRepository.updateModule(id, module);
        return [HttpStatusCode.OK, updatedModule];
    }
}

@injectable()
export class DeleteModuleUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IModulesRepository) private modulesRepository: IModulesRepository
    ) { }

    public async execute(id: string): Promise<[number, void]> {
        const exist = await this.modulesRepository.getModuleById(id);
        if (!exist) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Module not found');
        await this.modulesRepository.deleteModule(id);
        return [HttpStatusCode.NO_CONTENT, undefined];
    }
}
