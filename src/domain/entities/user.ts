import { HttpStatusCode } from "@application/shared/http.status";
import { HttpError } from "../errors/http.error";
import { IHashingService } from "../services/hashing.service";

export class User {
    constructor(
        public readonly id: number | null,
        public name: string,
        public last_name: string,
        public email: string,
        public role: number,
        public age?: number,
        public phone?: string,
        public password?: string,
        public readonly created_at?: Date,
        public readonly updated_at?: Date
    ) { }

    public async setPassword(password: string, hashingService: IHashingService): Promise<void> {
        this.password = await hashingService.hash(password);
    }

    public async comparePassword(plainPassword: string, hashingService: IHashingService): Promise<boolean> {
        if (!this.password) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'User password is not set');
        return await hashingService.compare(plainPassword, this.password);
    }
}