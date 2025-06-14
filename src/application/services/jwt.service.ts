export interface IJwtService {
    generateToken(payload: object): string;
}