import { GetRolesDTO, GetRolesResponseDTO } from '../../application/dtos/role.dto';
import { Role } from '../entities/role';

export interface IRoleRepository {
    getRoles(filters: GetRolesDTO): Promise<GetRolesResponseDTO>;
    createRole(role: Role): Promise<Role>;
}
