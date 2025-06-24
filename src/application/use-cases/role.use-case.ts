import { inject, injectable } from 'inversify';
import { DOMAIN_TYPES } from '../../domain/ioc.types';
import { IRoleRepository } from '../../domain/repositories/role.repository';
import { Role } from '../../domain/entities/role';
import { HttpStatusCode } from '../../domain/shared/http.status';
import { CreateRoleDTO, GetPermissionsResponeDTO, GetRolesDTO, GetRolesResponseDTO, RoleResponseDTO } from '../dtos/role.dto';
import { HttpError } from '../../domain/errors/http.error';
import { Pool } from 'pg';
import { INFRASTRUCTURE_TYPES } from '../../infraestructure/ioc/types';

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
        @inject(DOMAIN_TYPES.IRoleRepository) private roleRepository: IRoleRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: CreateRoleDTO): Promise<[number, RoleResponseDTO]> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const roleEntity = new Role(null, dto.name, dto.description, dto.permissions);
            if (!roleEntity.permissions) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'missing permissions');

            const newRole = await this.roleRepository.createRole(roleEntity, client);
            if (!newRole.id) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'creation error');

            await this.roleRepository.assignPermissionsToRole(newRole.id, roleEntity.permissions, client);

            await client.query('COMMIT');

            return [HttpStatusCode.CREATED, newRole];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in CreateRoleUseCase:', error);
            throw error instanceof HttpError ? error : new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown error');
        } finally {
            client.release();
        }
    }
}

@injectable()
export class UpdateRoleUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IRoleRepository) private roleRepository: IRoleRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(id: string, dto: CreateRoleDTO): Promise<[number, object]> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const role = new Role(id, dto.name, dto.description, dto.permissions);

            await this.roleRepository.updateRole(id, role, client);

            await this.roleRepository.updateRolePermissions(id, dto.permissions, client);

            await client.query('COMMIT');

            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in UpdateRoleUseCase:', error);
            throw error instanceof HttpError ? error : new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown error');
        } finally {
            client.release();
        }
    }
}

@injectable()
export class DeleteRoleUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IRoleRepository) private roleRepository: IRoleRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(id: string): Promise<[number, object]> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            await this.roleRepository.deleteRole(id, client);

            await client.query('COMMIT');

            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in DeleteRoleUseCase:', error);
            throw error instanceof HttpError ? error : new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown error');
        } finally {
            client.release();
        }
    }
}