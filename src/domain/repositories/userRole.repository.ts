import { UserRole } from '../entities/userRole';
import { Role } from '../entities/role';
import { PoolClient } from 'pg';

export interface IUserRoleRepository {
    assignRoleToUser(userRole: UserRole, client: PoolClient): Promise<UserRole>;
    removeRoleFromUser(userId: string, roleId: string): Promise<void>; // Added removeRoleFromUser
}
