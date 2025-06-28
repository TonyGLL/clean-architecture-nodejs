import { injectable } from "inversify";
import { IJwtService } from "../../../application/services/jwt.service";
import { config } from "../../config/env";
import { sign, verify } from "jsonwebtoken";
import { StringValue } from 'ms';
import { HttpError } from "../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../domain/shared/http.status";
import { ServiceType } from "../../../application/dtos/auth.admin.dto";

@injectable()
export class JwtService implements IJwtService {
    private readonly secret_client = config.JWT_SECRET_CLIENT;
    private readonly secret_admin = config.JWT_SECRET_ADMIN;

    constructor() { }

    public generateToken(payload: object, expiresIn: StringValue, type: ServiceType): string {
        return sign(payload, type === 'admin' ? this.secret_admin : this.secret_client, { expiresIn });
    }

    public validateToken(token: string, type: ServiceType): any {
        try {
            const decoded = verify(token, type === 'admin' ? this.secret_admin : this.secret_client);
            return decoded;
        } catch (error: any) {
            // Log error for server-side debugging: console.error("JWT Validation Error:", error.message);
            if (error.name === "TokenExpiredError") {
                throw new HttpError(HttpStatusCode.FORBIDDEN, "Token expired.");
            }
            if (error.name === "JsonWebTokenError") {
                throw new HttpError(HttpStatusCode.FORBIDDEN, "Invalid token.");
            }
            // Fallback for other errors
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Could not process token.");
        }
    }
}