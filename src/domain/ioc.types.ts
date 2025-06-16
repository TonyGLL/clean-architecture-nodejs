export const DOMAIN_TYPES = {
    IUserRepository: Symbol.for('IUserRepository'),
    IHashingService: Symbol.for('IHashingService'),
    // Considering IMailService based on previous analysis, let's add it.
    IMailService: Symbol.for('IMailService')
};
