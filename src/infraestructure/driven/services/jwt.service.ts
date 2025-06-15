import { injectable } from "inversify";
import { IJwtService } from "../../../application/services/jwt.service";
import { config } from "../../config/env";
import { sign } from "jsonwebtoken";

@injectable()
export class JwtService implements IJwtService {
    private readonly secret = config.JWT_SECRET;

    constructor() {
        if (!this.secret) throw new Error('Secret missing');
    }

    public generateToken(payload: object): string {
        return sign(payload, this.secret, { expiresIn: '1h' });
    }
}