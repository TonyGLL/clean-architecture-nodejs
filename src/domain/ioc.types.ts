export const DOMAIN_TYPES = {
    IAuthRepository: Symbol.for('IAuthRepository'),
    IUserRepository: Symbol.for('IUserRepository'),
    IHashingService: Symbol.for('IHashingService'),
    // Considering IMailService based on previous analysis, let's add it.
    IMailService: Symbol.for('IMailService'),
    IRoleRepository: Symbol.for('IRoleRepository'),
    IUserRoleRepository: Symbol.for('IUserRoleRepository'),
    IModulesRepository: Symbol.for('IModulesRepository'),
    IProductsRepository: Symbol.for('IProductsRepository'),
    ICartRepository: Symbol.for('ICartRepository'),
    IPaymentRepository: Symbol.for("IPaymentRepository"),
    IPaymentService: Symbol.for("IPaymentService"),
    IOrderRepository: Symbol.for("IOrderRepository"), // Added
};
