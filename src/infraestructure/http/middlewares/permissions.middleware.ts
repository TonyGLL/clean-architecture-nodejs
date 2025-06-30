import { NextFunction, Request, Response } from "express";
import { GetPermissionsByRoleUseCase } from "../../../application/use-cases/role.use-case";
import { container } from "../../ioc/config";
import { APPLICATION_TYPES } from "../../../application/ioc.types";
import { RolePermissions } from "../../../application/dtos/role.dto";
import { HttpError } from "../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../domain/shared/http.status";

const methodToPermissionMap: Record<string, keyof Omit<RolePermissions, 'module_id' | 'module_name'>> = {
    'GET': 'can_read',
    'POST': 'can_write',
    'PUT': 'can_update',
    'PATCH': 'can_update',
    'DELETE': 'can_delete'
};

export const permissionsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as { id: string; roles: Array<{ id: string; name: string }> }; // More specific type for user
        if (!user || !user.roles || user.roles.length === 0) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, "Unauthorized: User not found or no roles assigned");
        }

        const pathParts = req.baseUrl.split('/');
        const moduleName = pathParts.pop(); // Extract module name from base URL, e.g. 'users' from '/api/v1/users'
        if (!moduleName) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "Bad Request: Module name not found in URL");
        }

        const httpMethod = req.method.toUpperCase();
        const requiredPermission = methodToPermissionMap[httpMethod];

        if (!requiredPermission) {
            throw new HttpError(HttpStatusCode.METHOD_NOT_ALLOWED, `Method ${httpMethod} not supported for permission checking`);
        }

        const getPermissionsByRoleUseCase = container.get<GetPermissionsByRoleUseCase>(APPLICATION_TYPES.GetPermissionsByRoleUseCase);

        let hasPermission = false;

        // Iterate over each role the user has
        for (const userRole of user.roles) {
            // Fetch permissions for the current role
            // Ensure role.id is a string. If it's a number or other type, adjust accordingly.
            const [, permissionsData] = await getPermissionsByRoleUseCase.execute(String(userRole.id));

            // Check if permissionsData is not empty and is an array
            if (Array.isArray(permissionsData) && permissionsData.length > 0) {
                // Find the specific set of permissions for this role (e.g. by role name or ID)
                // This assumes GetPermissionsByRoleUseCase returns an array where each element corresponds to a role's permissions.
                // And, that each element has a 'name' or 'id' to match with userRole and a 'permissions' array.
                // Ensure consistent type comparison for IDs (e.g., convert both to string or number if necessary)
                const roleSpecificPermissions = permissionsData.find(p => String(p.id) === String(userRole.id) || p.name === userRole.name);

                if (roleSpecificPermissions && roleSpecificPermissions.permissions) {
                    // Find if this role has permissions for the target module
                    const modulePermission = roleSpecificPermissions.permissions.find(
                        p => p.module_name.toLowerCase() === moduleName.toLowerCase()
                    );

                    // Check if the action (read, write, etc.) is permitted
                    if (modulePermission && modulePermission[requiredPermission]) {
                        hasPermission = true;
                        break; // Permission found, no need to check other roles
                    }
                }
            }
        }

        if (hasPermission) {
            next();
        } else {
            // If no permission was found after checking all roles, deny access
            return next(new HttpError(HttpStatusCode.FORBIDDEN, `Forbidden: You do not have permission to ${httpMethod} on module ${moduleName}`));
        }

    } catch (error) {
        // Pass errors to the next error-handling middleware
        next(error);
    }
}