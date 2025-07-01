import { NextFunction, Request, Response } from "express";
import { container } from "../../ioc/config";
import { RolePermissions } from "../../../application/dtos/role.dto";
import { HttpError } from "../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../domain/shared/http.status";
import { DOMAIN_TYPES } from "../../../domain/ioc.types";
import { IRoleRepository } from "../../../domain/repositories/role.repository";
import { IModulesRepository } from "../../../domain/repositories/modules.repository";

const methodToPermissionMap: Record<string, keyof Omit<RolePermissions, 'module_id' | 'module_name'>> = {
    'GET': 'can_read',
    'POST': 'can_write',
    'PUT': 'can_update',
    'PATCH': 'can_update',
    'DELETE': 'can_delete'
};

export const permissionsMiddleware = async (req: Request, _: Response, next: NextFunction) => {
    try {
        const user = req.user as { id: string; roles: number[] };
        if (!user || !user.roles || user.roles.length === 0) throw new HttpError(HttpStatusCode.UNAUTHORIZED, "Unauthorized: User not found or no roles assigned");

        const pathParts = req.path.split('/');
        const [_, moduleName] = pathParts;
        if (!moduleName) throw new HttpError(HttpStatusCode.BAD_REQUEST, "Bad Request: Module name not found in URL");

        const httpMethod = req.method.toUpperCase();
        const requiredPermission = methodToPermissionMap[httpMethod];
        if (!requiredPermission) throw new HttpError(HttpStatusCode.METHOD_NOT_ALLOWED, `Method ${httpMethod} not supported for permission checking`);


        const modulesRepository = container.get<IModulesRepository>(DOMAIN_TYPES.IModulesRepository);
        const module = await modulesRepository.getModuleByName(moduleName);
        if (!module || !module.id) throw new HttpError(HttpStatusCode.NOT_FOUND, `Module ${moduleName} not found`);

        const roleRepository = container.get<IRoleRepository>(DOMAIN_TYPES.IRoleRepository);
        const permissions = await roleRepository.getPermissionByRoleAndModule({ roleId: user.roles[0], moduleId: Number.parseInt(module.id) });
        if (!permissions) throw new HttpError(HttpStatusCode.FORBIDDEN, `Forbidden: You do not have permission to ${httpMethod} on module ${moduleName}`);

        if (permissions[requiredPermission]) {
            next();
        } else {
            throw new HttpError(HttpStatusCode.FORBIDDEN, `Forbidden: You do not have permission to ${httpMethod} on module ${moduleName}`);
        }

    } catch (error) {
        next(error);
    }
}