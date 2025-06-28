import { GetAllModulesResponseDTO } from "../../application/dtos/modules.dto";
import { Module } from "../entities/module";

export interface IModulesRepository {
    getAllModules(): Promise<GetAllModulesResponseDTO>;
    getModuleById(id: string): Promise<Module>;
    getModuleByName(name: string): Promise<Module | null>;
    createModule(module: Omit<Module, 'id'>): Promise<Module>;
    updateModule(id: string, module: Omit<Module, 'id'>): Promise<Module>;
    deleteModule(id: string): Promise<void>;
}