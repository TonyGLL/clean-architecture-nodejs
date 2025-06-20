import { Role } from '../entities/role';

export interface IRoleRepository {
    createRole(role: Role): Promise<Role>;
    findRoleByName(name: string): Promise<Role | null>;
    findRoleById(id: string): Promise<Role | null>; // Added findRoleById
}
