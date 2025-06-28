import { GetAllModulesResponseDTO } from "../../application/dtos/modules.dto";

export interface IModulesRepository {
    getAllModules(): Promise<GetAllModulesResponseDTO>;
    getModuleById(id: string): Promise<GetAllModulesResponseDTO>;
    createModule(module: Omit<GetAllModulesResponseDTO, 'id'>): Promise<GetAllModulesResponseDTO>;
    updateModule(id: string, module: Omit<GetAllModulesResponseDTO, 'id'>): Promise<GetAllModulesResponseDTO>;
    deleteModule(id: string): Promise<void>;
}