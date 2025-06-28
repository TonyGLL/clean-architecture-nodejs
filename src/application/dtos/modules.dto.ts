import { Module } from "../../domain/entities/module";

export interface GetAllModulesResponseDTO {
    modules: Module[];
    total: number;
}