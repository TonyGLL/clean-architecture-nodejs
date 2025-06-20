export const APPLICATION_TYPES = {
    IJwtService: Symbol.for('IJwtService'),
    CreateRoleUseCase: Symbol.for("CreateRoleUseCase"),
    AssignRoleToUserUseCase: Symbol.for("AssignRoleToUserUseCase"),
    GetRolesForUserUseCase: Symbol.for("GetRolesForUserUseCase"),
    RevokeRoleFromUserUseCase: Symbol.for("RevokeRoleFromUserUseCase")
};
