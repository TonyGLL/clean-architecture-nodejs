import { Pool } from "pg";
import { IModulesRepository } from "../../../../domain/repositories/modules.repository";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { inject, injectable } from "inversify";
import { GetAllModulesResponseDTO } from "../../../../application/dtos/modules.dto";
import { Module } from "../../../../domain/entities/module";

@injectable()
export class PostegresModulesRepository implements IModulesRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async getAllModules(): Promise<GetAllModulesResponseDTO> {
        const text = `SELECT * FROM modules`;
        const rows = (await this.pool.query<Module>(text)).rows;

        return {
            modules: rows,
            total: rows.length
        };
    }
    getModuleById(id: string): Promise<GetAllModulesResponseDTO> {
        throw new Error("Method not implemented.");
    }
    createModule(module: Omit<GetAllModulesResponseDTO, "id">): Promise<GetAllModulesResponseDTO> {
        throw new Error("Method not implemented.");
    }
    updateModule(id: string, module: Omit<GetAllModulesResponseDTO, "id">): Promise<GetAllModulesResponseDTO> {
        throw new Error("Method not implemented.");
    }
    deleteModule(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}