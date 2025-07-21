import { NextFunction, Request, Response } from "express";
import { container } from "../../ioc/config";
import { RolePermissions } from "../../../application/dtos/role.dto";
import { HttpError } from "../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../domain/shared/http.status";
import { DOMAIN_TYPES } from "../../../domain/ioc.types";
import { IRoleRepository } from "../../../domain/repositories/role.repository";
import { IModulesRepository } from "../../../domain/repositories/modules.repository";

/**
 * @description Map that converts HTTP methods to permission names.
 * This allows determining what type of permission is required according to the request method (GET, POST, PUT, DELETE).
 * @type {Record<string, keyof Omit<RolePermissions, 'module_id' | 'module_name'>>}
 */
const methodToPermissionMap: Record<string, keyof Omit<RolePermissions, 'module_id' | 'module_name'>> = {
    'GET': 'can_read',
    'POST': 'can_write',
    'PUT': 'can_update',
    'PATCH': 'can_update',
    'DELETE': 'can_delete'
};

/**
 * @description Middleware to check a user's permissions before allowing access to a resource.
 * This middleware is responsible for:
 * 1. Validating that the user has assigned roles.
 * 2. Extracting the module name from the URL.
 * 3. Determining the required permission based on the HTTP method.
 * 4. Getting the module from the database.
 * 5. Querying the user's role permissions for that module.
 * 6. Allowing or denying access based on permissions.
 * @param {Request} req - The Express request object.
 * @param {Response} _ - The Express response object (not used directly).
 * @param {NextFunction} next - The function to pass to the next middleware.
 */
export const permissionsMiddleware = async (req: Request, _: Response, next: NextFunction) => {
    try {
        // 1. Extract user information and their roles from the `req.user` object, which is added by the `auth.middleware`.
        const user = req.user as { id: string; roles: number[] };
        if (!user || !user.roles || user.roles.length === 0) throw new HttpError(HttpStatusCode.UNAUTHORIZED, "Unauthorized: User not found or no roles assigned");

        // 2. Get the module name from the URL. It is assumed that the URL follows a format like `/moduleName/...`.
        const pathParts = req.path.split('/');
        const [_, moduleName] = pathParts;
        if (!moduleName) throw new HttpError(HttpStatusCode.BAD_REQUEST, "Bad Request: Module name not found in URL");

        // 3. Determine the required permission based on the HTTP method of the request.
        const httpMethod = req.method.toUpperCase();
        const requiredPermission = methodToPermissionMap[httpMethod];
        if (!requiredPermission) throw new HttpError(HttpStatusCode.METHOD_NOT_ALLOWED, `Method ${httpMethod} not supported for permission checking`);

        // 4. Get the module information from the database to ensure it exists.
        const modulesRepository = container.get<IModulesRepository>(DOMAIN_TYPES.IModulesRepository);
        const module = await modulesRepository.getModuleByName(moduleName);
        if (!module || !module.id) throw new HttpError(HttpStatusCode.NOT_FOUND, `Module ${moduleName} not found`);

        // 5. Verify the permissions for all user roles concurrently.
        const roleRepository = container.get<IRoleRepository>(DOMAIN_TYPES.IRoleRepository);

        // Create a list of promises. Each promise resolves if the role has the permission and is rejected if it does not.
        const permissionChecks = user.roles.map(roleId => {
            return new Promise<void>((resolve, reject) => {
                roleRepository.getPermissionByRoleAndModule({ roleId, moduleId: Number.parseInt(module.id!) })
                    .then(permissions => {
                        if (permissions && permissions[requiredPermission]) {
                            resolve(); // Permission found, the promise is fulfilled.
                        } else {
                            reject(); // Permission not found or null, the promise is rejected.
                        }
                    })
                    .catch(reject); // Propagate query errors.
            });
        });

        try {
            // Promise.all() will resolve as soon as all permission verification promises are fulfilled.
            await Promise.all(permissionChecks);
            next();
        } catch (error) {
            // If Promise.all() is rejected, it means that NONE of the promises were fulfilled.
            // That is, at least 1 role did not have the required permission.
            // The Promise.all error is an AggregateError, but we do not need its details here.
            next(new HttpError(HttpStatusCode.FORBIDDEN, `Forbidden: You do not have permission to ${httpMethod} on module ${moduleName}`));
        }

    } catch (error) {
        // If any error occurs during the process, it is passed to the next error handling middleware.
        next(error);
    }
}