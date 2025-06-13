import { IHashingService } from "../services/hashing.service";

export class User {
    constructor(
        public readonly id: string | null,
        public name: string,
        public email: string,
        public password?: string,
        public readonly created_at?: Date,
        public readonly updated_at?: Date
    ) { }

    public async setPassword(password: string, hashingService: IHashingService): Promise<void> {
        this.password = await hashingService.hash(password);
    }

    public async comparePassword(plainPassword: string, hashingService: IHashingService): Promise<boolean> {
        if (!this.password) throw new Error('User password is not set');
        return await hashingService.compare(plainPassword, this.password);
    }
}