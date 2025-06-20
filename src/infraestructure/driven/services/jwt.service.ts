import { injectable } from "inversify";
import { IJwtService } from "../../../application/services/jwt.service";
import { config } from "../../config/env";
import { sign, verify } from "jsonwebtoken";
import { StringValue } from 'ms';
import { HttpError } from "../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../domain/shared/http.status";

@injectable()
export class JwtService implements IJwtService {
    private readonly secret = config.JWT_SECRET;

    constructor() {
        if (!this.secret) throw new Error('Secret missing');
    }

    public generateToken(payload: object, expiresIn: StringValue): string {
        return sign(payload, this.secret, { expiresIn });
    }

    public validateToken(token: string): any {
        try {
            const decoded = verify(token, this.secret);
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