import { UserRole } from '../entities/userRole';
import { Role } from '../entities/role';

export interface IUserRoleRepository {
    assignRoleToUser(userRole: UserRole): Promise<UserRole>;
    findRolesByUserId(userId: string): Promise<Role[]>;
    removeRoleFromUser(userId: string, roleId: string): Promise<void>; // Added removeRoleFromUser
}
