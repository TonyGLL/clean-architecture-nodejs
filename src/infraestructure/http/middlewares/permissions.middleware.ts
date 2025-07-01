import { NextFunction, Request, Response } from "express";
import { container } from "../../ioc/config";
import { RolePermissions } from "../../../application/dtos/role.dto";
import { HttpError } from "../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../domain/shared/http.status";
import { DOMAIN_TYPES } from "../../../domain/ioc.types";
import { IRoleRepository } from "../../../domain/repositories/role.repository";
import { IModulesRepository } from "../../../domain/repositories/modules.repository";

/**
 * @description Mapa que convierte los métodos HTTP a nombres de permisos.
 * Esto permite determinar qué tipo de permiso se requiere según el método de la petición (GET, POST, PUT, DELETE).
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
 * @description Middleware para verificar los permisos de un usuario antes de permitir el acceso a un recurso.
 * Este middleware se encarga de:
 * 1. Validar que el usuario tenga roles asignados.
 * 2. Extraer el nombre del módulo de la URL.
 * 3. Determinar el permiso requerido basado en el método HTTP.
 * 4. Obtener el módulo de la base de datos.
 * 5. Consultar los permisos del rol del usuario para ese módulo.
 * 6. Permitir o denegar el acceso según los permisos.
 * @param {Request} req - El objeto de la petición de Express.
 * @param {Response} _ - El objeto de la respuesta de Express (no se utiliza directamente).
 * @param {NextFunction} next - La función para pasar al siguiente middleware.
 */
export const permissionsMiddleware = async (req: Request, _: Response, next: NextFunction) => {
    try {
        // 1. Extraer la información del usuario y sus roles desde el objeto `req.user`, que es añadido por el `auth.middleware`.
        const user = req.user as { id: string; roles: number[] };
        if (!user || !user.roles || user.roles.length === 0) throw new HttpError(HttpStatusCode.UNAUTHORIZED, "Unauthorized: User not found or no roles assigned");

        // 2. Obtener el nombre del módulo desde la URL. Se asume que la URL sigue un formato como `/moduleName/...`.
        const pathParts = req.path.split('/');
        const [_, moduleName] = pathParts;
        if (!moduleName) throw new HttpError(HttpStatusCode.BAD_REQUEST, "Bad Request: Module name not found in URL");

        // 3. Determinar el permiso requerido basado en el método HTTP de la petición.
        const httpMethod = req.method.toUpperCase();
        const requiredPermission = methodToPermissionMap[httpMethod];
        if (!requiredPermission) throw new HttpError(HttpStatusCode.METHOD_NOT_ALLOWED, `Method ${httpMethod} not supported for permission checking`);

        // 4. Obtener la información del módulo desde la base de datos para asegurar que existe.
        const modulesRepository = container.get<IModulesRepository>(DOMAIN_TYPES.IModulesRepository);
        const module = await modulesRepository.getModuleByName(moduleName);
        if (!module || !module.id) throw new HttpError(HttpStatusCode.NOT_FOUND, `Module ${moduleName} not found`);

        // 5. Obtener los permisos específicos del rol del usuario para el módulo solicitado.
        // Nota: Se está tomando el primer rol del array `user.roles[0]`. Esto podría ser ajustado si un usuario puede tener múltiples roles activos a la vez.
        const roleRepository = container.get<IRoleRepository>(DOMAIN_TYPES.IRoleRepository);
        const permissions = await roleRepository.getPermissionByRoleAndModule({ roleId: user.roles[0], moduleId: Number.parseInt(module.id) });
        if (!permissions) throw new HttpError(HttpStatusCode.FORBIDDEN, `Forbidden: You do not have permission to ${httpMethod} on module ${moduleName}`);

        // 6. Verificar si el usuario tiene el permiso requerido para la acción que intenta realizar.
        if (permissions[requiredPermission]) {
            // Si tiene el permiso, se le permite continuar con la siguiente función en la cadena de middlewares.
            next();
        } else {
            // Si no tiene el permiso, se lanza un error de "Forbidden".
            throw new HttpError(HttpStatusCode.FORBIDDEN, `Forbidden: You do not have permission to ${httpMethod} on module ${moduleName}`);
        }

    } catch (error) {
        // Si ocurre cualquier error durante el proceso, se pasa al siguiente middleware de manejo de errores.
        next(error);
    }
}