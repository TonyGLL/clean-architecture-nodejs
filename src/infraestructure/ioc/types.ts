export const TYPES = {
    //* Repositories
    IUserRepository: Symbol.for('IUserRepository'),

    //* Services
    IHashingService: Symbol.for('IHashingService'),
    IJwtService: Symbol.for('IJwtService'),

    //* DB
    PostgresPool: Symbol.for('PostgresPool')
}