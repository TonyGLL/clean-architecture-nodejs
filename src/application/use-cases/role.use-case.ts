import { inject, injectable } from 'inversify';
import { DOMAIN_TYPES } from '../../domain/ioc.types';
import { IRoleRepository } from '../../domain/repositories/role.repository';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IUserRoleRepository } from '../../domain/repositories/userRole.repository';
import { Role } from '../../domain/entities/role';
import { UserRole } from '../../domain/entities/userRole';
import { HttpError } from '../../domain/errors/http.error';
import { HttpStatusCode } from '../../domain/shared/http.status';

// DTOs for Role Use Cases
export interface CreateRoleDTO {
    name: string;
}

export interface AssignRoleToUserDTO {
    userId: string;
    roleName: string; // Using role name for assignment might be more user-friendly
}

export interface RoleResponseDTO {
    id: string | null;
    name: string;
}

export interface UserRoleResponseDTO {
    userId: string;
    roleId: string;
}

@injectable()
export class CreateRoleUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IRoleRepository) private roleRepository: IRoleRepository
    ) { }

    public async execute(dto: CreateRoleDTO): Promise<[number, RoleResponseDTO]> {
        const existingRole = await this.roleRepository.findRoleByName(dto.name);
        if (existingRole) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Role already exists.');
        }
        const roleEntity = new Role(null, dto.name);
        const newRole = await this.roleRepository.createRole(roleEntity);
        return [HttpStatusCode.CREATED, { id: newRole.id, name: newRole.name }];
    }
}

@injectable()
export class AssignRoleToUserUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IRoleRepository) private roleRepository: IRoleRepository,
        @inject(DOMAIN_TYPES.IUserRoleRepository) private userRoleRepository: IUserRoleRepository
    ) { }

    public async execute(dto: AssignRoleToUserDTO): Promise<[number, UserRoleResponseDTO]> {
        const user = await this.userRepository.findById(dto.userId);
        if (!user) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');
        }

        const role = await this.roleRepository.findRoleByName(dto.roleName);
        if (!role || !role.id) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found.');
        }

        // Check if user already has this role
        const userRoles = await this.userRoleRepository.findRolesByUserId(dto.userId);
        if (userRoles.some(userRole => userRole.id === role.id)) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, 'User already has this role.');
        }

        const userRoleEntity = new UserRole(dto.userId, role.id);
        const assignedRole = await this.userRoleRepository.assignRoleToUser(userRoleEntity);
        return [HttpStatusCode.CREATED, { userId: assignedRole.userId, roleId: assignedRole.roleId }];
    }
}

@injectable()
export class GetRolesForUserUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IUserRoleRepository) private userRoleRepository: IUserRoleRepository
    ) { }

    public async execute(userId: string): Promise<[number, RoleResponseDTO[]]> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');
        }
        const roles = await this.userRoleRepository.findRolesByUserId(userId);
        const roleDTOs = roles.map(role => ({ id: role.id, name: role.name }));
        return [HttpStatusCode.OK, roleDTOs];
    }
}

@injectable()
export class RevokeRoleFromUserUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(DOMAIN_TYPES.IRoleRepository) private roleRepository: IRoleRepository,
        @inject(DOMAIN_TYPES.IUserRoleRepository) private userRoleRepository: IUserRoleRepository
    ) { }

    public async execute(userId: string, roleName: string): Promise<[number, object]> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found.');
        }

        const role = await this.roleRepository.findRoleByName(roleName);
        if (!role || !role.id) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found.');
        }

        // Check if user actually has this role
        const userRoles = await this.userRoleRepository.findRolesByUserId(userId);
        if (!userRoles.some(userRole => userRole.id === role.id)) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, 'User does not have this role.');
        }

        await this.userRoleRepository.removeRoleFromUser(userId, role.id);
        return [HttpStatusCode.NO_CONTENT, {}];
    }
}
