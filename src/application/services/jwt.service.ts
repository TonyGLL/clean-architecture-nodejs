import { StringValue } from 'ms';
export interface IJwtService {
    generateToken(payload: object, expiresIn: StringValue): string;
    validateToken(token: string): void;
}