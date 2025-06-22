import { GetRolesDTO } from '../../application/dtos/role.dto';
import { Role } from '../entities/role';

export interface IRoleRepository {
    getRoles(filters: GetRolesDTO): Promise<Role[]>;
    createRole(role: Role): Promise<Role>;
}
