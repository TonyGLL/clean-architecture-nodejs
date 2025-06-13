export interface IHashingService {
    hash(plainText: string): Promise<string>;
    compare(plainText: string, hashedText: string): Promise<boolean>;
}