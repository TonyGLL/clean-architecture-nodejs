import { inject, injectable } from 'inversify';
import { DOMAIN_TYPES } from '../../domain/ioc.types';
import { IRoleRepository } from '../../domain/repositories/role.repository';
import { Role } from '../../domain/entities/role';
import { HttpStatusCode } from '../../domain/shared/http.status';
import { CreateRoleDTO, GetPermissionsResponeDTO, GetRolesDTO, GetRolesResponseDTO, RoleResponseDTO } from '../dtos/role.dto';

@injectable()
export class GetRolesUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IRoleRepository) private roleRepository: IRoleRepository
    ) { }

    public async execute(dto: GetRolesDTO): Promise<[number, GetRolesResponseDTO]> {
        const roles = await this.roleRepository.getRoles(dto);
        return [HttpStatusCode.OK, roles];
    }
}

@injectable()
export class GetPermissionsByRoleUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IRoleRepository) private roleRepository: IRoleRepository
    ) { }

    public async execute(id: string): Promise<[number, GetPermissionsResponeDTO[]]> {
        const roles = await this.roleRepository.getPermissionsByRole(id);
        return [HttpStatusCode.OK, roles];
    }
}

@injectable()
export class CreateRoleUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IRoleRepository) private roleRepository: IRoleRepository
    ) { }

    public async execute(dto: CreateRoleDTO): Promise<[number, RoleResponseDTO]> {
        const roleEntity = new Role(null, dto.name);
        const newRole = await this.roleRepository.createRole(roleEntity);
        return [HttpStatusCode.CREATED, { id: newRole.id, name: newRole.name }];
    }
}