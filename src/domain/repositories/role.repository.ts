import { GetPermissionsResponeDTO, GetRolesDTO, GetRolesResponseDTO } from '../../application/dtos/role.dto';
import { Role } from '../entities/role';

export interface IRoleRepository {
    getRoles(filters: GetRolesDTO): Promise<GetRolesResponseDTO>;
    getPermissionsByRole(id: string): Promise<GetPermissionsResponeDTO[]>;
    createRole(role: Role): Promise<Role>;
}
