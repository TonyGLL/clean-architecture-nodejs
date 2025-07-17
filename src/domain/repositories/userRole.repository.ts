import { UserRole } from '../entities/userRole';
import { Role } from '../entities/role';
import { PoolClient } from 'pg';

/**
 * @interface IUserRoleRepository
 * @desc Interface for user role repository
 */
export interface IUserRoleRepository {
    /**
     * @method assignRoleToUser
     * @param {UserRole} userRole
     * @param {PoolClient} client
     * @returns {Promise<UserRole>}
     * @desc Assign a role to a user
     */
    assignRoleToUser(userRole: UserRole, client: PoolClient): Promise<UserRole>;

    /**
     * @method removeRoleFromUser
     * @param {string} userId
     * @param {string} roleId
     * @returns {Promise<void>}
     * @desc Remove a role from a user
     */
    removeRoleFromUser(userId: string, roleId: string): Promise<void>;
}
