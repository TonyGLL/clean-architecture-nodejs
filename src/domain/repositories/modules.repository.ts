import { GetAllModulesResponseDTO } from "../../application/dtos/modules.dto";
import { Module } from "../entities/module";

/**
 * @interface IModulesRepository
 * @desc Interface for modules repository
 */
export interface IModulesRepository {
    /**
     * @method getAllModules
     * @returns {Promise<GetAllModulesResponseDTO>}
     * @desc Get all modules
     */
    getAllModules(): Promise<GetAllModulesResponseDTO>;

    /**
     * @method getModuleById
     * @param {string} id
     * @returns {Promise<Module>}
     * @desc Get a module by its ID
     */
    getModuleById(id: string): Promise<Module>;

    /**
     * @method getModuleByName
     * @param {string} name
     * @returns {Promise<Module | null>}
     * @desc Get a module by its name
     */
    getModuleByName(name: string): Promise<Module | null>;

    /**
     * @method createModule
     * @param {Omit<Module, 'id'>} module
     * @returns {Promise<Module>}
     * @desc Create a new module
     */
    createModule(module: Omit<Module, 'id'>): Promise<Module>;

    /**
     * @method updateModule
     * @param {string} id
     * @param {Omit<Module, 'id'>} module
     * @returns {Promise<Module>}
     * @desc Update a module
     */
    updateModule(id: string, module: Omit<Module, 'id'>): Promise<Module>;

    /**
     * @method deleteModule
     * @param {string} id
     * @returns {Promise<void>}
     * @desc Delete a module
     */
    deleteModule(id: string): Promise<void>;
}