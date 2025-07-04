import { Pool } from "pg";
import { IModulesRepository } from "../../../../domain/repositories/modules.repository";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { inject, injectable } from "inversify";
import { GetAllModulesResponseDTO } from "../../../../application/dtos/modules.dto";
import { Module } from "../../../../domain/entities/module";

@injectable()
export class PostgresModulesRepository implements IModulesRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async getAllModules(): Promise<GetAllModulesResponseDTO> {
        const text = `SELECT * FROM modules WHERE deleted IS FALSE`;
        const rows = (await this.pool.query<Module>(text)).rows;

        return {
            modules: rows,
            total: rows.length
        };
    }
    public async getModuleById(id: string): Promise<Module> {
        const text = `SELECT * FROM modules WHERE id = $1 AND deleted IS FALSE`;
        const values = [id];
        const { rows } = await this.pool.query<Module>(text, values);
        if (!rows[0]) {
            throw new Error(`Module with id ${id} not found`);
        }
        return rows[0];
    }
    public async getModuleByName(name: string): Promise<Module | null> {
        const text = `SELECT * FROM modules WHERE name = $1 AND deleted IS FALSE`;
        const values = [name];
        const { rows } = await this.pool.query<Module>(text, values);
        return rows[0] || null;
    }
    public async createModule(module: Omit<Module, 'id'>): Promise<Module> {
        const text = `INSERT INTO modules (name, description) VALUES ($1, $2) RETURNING *`;
        const values = [module.name, module.description];
        const { rows } = await this.pool.query<Module>(text, values);
        return rows[0];
    }
    public async updateModule(id: string, module: Omit<Module, 'id'>): Promise<Module> {
        const text = `UPDATE modules SET name = $1, description = $2, "updatedAt" = now() WHERE id = $3 AND deleted IS FALSE RETURNING *`;
        const values = [module.name, module.description, id];
        const { rows } = await this.pool.query<Module>(text, values);
        if (!rows[0]) {
            throw new Error(`Module with id ${id} not found`);
        }
        return rows[0];
    }
    public async deleteModule(id: string): Promise<void> {
        const text = `UPDATE modules SET deleted = TRUE WHERE id = $1 AND deleted IS FALSE`;
        const values = [id];
        await this.pool.query(text, values);
    }
}