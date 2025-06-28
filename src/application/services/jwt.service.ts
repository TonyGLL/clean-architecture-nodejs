import { StringValue } from 'ms';
import { ServiceType } from '../dtos/auth.admin.dto';
export interface IJwtService {
    generateToken(payload: object, expiresIn: StringValue, type: ServiceType): string;
    validateToken(token: string, type: ServiceType): any; /* Should return decoded payload or throw error */
}