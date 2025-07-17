import { PoolClient } from 'pg';
import { GetPermissionByRoleAndModuleDTO, GetPermissionsResponeDTO, GetRolesDTO, GetRolesResponseDTO, RolePermissions } from '../../application/dtos/role.dto';
import { Role } from '../entities/role';

/**
 * @interface IRoleRepository
 * @desc Interface for role repository
 */
export interface IRoleRepository {
    /**
     * @method getRoles
     * @param {GetRolesDTO} filters
     * @returns {Promise<GetRolesResponseDTO>}
     * @desc Get all roles
     */
    getRoles(filters: GetRolesDTO): Promise<GetRolesResponseDTO>;

    /**
     * @method getPermissionsByRole
     * @param {number} id
     * @returns {Promise<GetPermissionsResponeDTO[]>}
     * @desc Get permissions by role
     */
    getPermissionsByRole(id: number): Promise<GetPermissionsResponeDTO[]>;

    /**
     * @method createRole
     * @param {Role} role
     * @param {PoolClient} client
     * @returns {Promise<Role>}
     * @desc Create a new role
     */
    createRole(role: Role, client: PoolClient): Promise<Role>;

    /**
     * @method assignPermissionsToRole
     * @param {string} role_id
     * @param {RolePermissions[]} permissions
     * @param {PoolClient} client
     * @returns {Promise<void>}
     * @desc Assign permissions to a role
     */
    assignPermissionsToRole(role_id: string, permissions: RolePermissions[], client: PoolClient): Promise<void>;

    /**
     * @method updateRole
     * @param {string} role_id
     * @param {Omit<Role, 'permissions'>} role
     * @param {PoolClient} client
     * @returns {Promise<void>}
     * @desc Update a role
     */
    updateRole(role_id: string, role: Omit<Role, 'permissions'>, client: PoolClient): Promise<void>;

    /**
     * @method updateRolePermissions
     * @param {string} role_id
     * @param {RolePermissions[]} permissions
     * @param {PoolClient} client
     * @returns {Promise<void>}
     * @desc Update role permissions
     */
    updateRolePermissions(role_id: string, permissions: RolePermissions[], client: PoolClient): Promise<void>;

    /**
     * @method deleteRole
     * @param {string} role_id
     * @param {PoolClient} client
     * @returns {Promise<void>}
     * @desc Delete a role
     */
    deleteRole(role_id: string, client: PoolClient): Promise<void>;

    /**
     * @method getPermissionByRoleAndModule
     * @param {GetPermissionByRoleAndModuleDTO} req
     * @returns {Promise<RolePermissions>}
     * @desc Get permission by role and module
     */
    getPermissionByRoleAndModule(req: GetPermissionByRoleAndModuleDTO): Promise<RolePermissions>;
}
