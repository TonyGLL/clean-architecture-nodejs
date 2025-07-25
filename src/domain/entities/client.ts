import { Role } from './role';
import { HttpStatusCode } from "../shared/http.status";
import { HttpError } from "../errors/http.error";
import { IHashingService } from "../services/hashing.service";

export class Client {
    constructor(
        public readonly id: number | null,
        public name: string,
        public last_name: string,
        public email: string,
        public birth_date?: Date,
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