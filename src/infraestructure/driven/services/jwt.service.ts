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

    public validateToken(token: string): void {
        if (!verify(token, this.secret)) throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'UNAUTHORIZED');
    }
}