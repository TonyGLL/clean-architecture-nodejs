import { injectable } from "inversify";
import { IHashingService } from "@domain/services/hashing.service";
import { compare, hash } from "bcryptjs";

@injectable()
export class BcryptService implements IHashingService {
    public async hash(plainText: string): Promise<string> {
        return hash(plainText, 10);
    }

    public async compare(plainText: string, hashedText: string): Promise<boolean> {
        return compare(plainText, hashedText);
    }
}