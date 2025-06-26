export const DOMAIN_TYPES = {
    IAuthClientRepository: Symbol.for('IAuthClientRepository'),
    IUserRepository: Symbol.for('IUserRepository'),
    IHashingService: Symbol.for('IHashingService'),
    // Considering IMailService based on previous analysis, let's add it.
    IMailService: Symbol.for('IMailService'),
    IRoleRepository: Symbol.for('IRoleRepository'),
    IUserRoleRepository: Symbol.for('IUserRoleRepository')
};
