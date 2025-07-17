import { StringValue } from 'ms';
import { ServiceType } from '../dtos/auth.admin.dto';
export interface IJwtService {
    /**
     * Generates a JWT token.
     *
     * @name generateToken
     * @param {object} payload - The payload to sign.
     * @param {StringValue} expiresIn - The token expiration time.
     * @param {ServiceType} type - The service type.
     * @returns {string} The generated JWT token.
     *
     * @example
     * const token = jwtService.generateToken({ id: 1 }, '1h', 'access');
     */
    generateToken(payload: object, expiresIn: StringValue, type: ServiceType): string;

    /**
     * Validates a JWT token.
     *
     * @name validateToken
     * @param {string} token - The JWT token to validate.
     * @param {ServiceType} type - The service type.
     * @returns {any} The decoded payload or throws an error.
     *
     * @example
     * const payload = jwtService.validateToken(token, 'access');
     */
    validateToken(token: string, type: ServiceType): any; /* Should return decoded payload or throw error */
}