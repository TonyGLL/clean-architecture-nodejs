import { User } from "../entities/user";

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    save(user: Omit<User, 'id'>): Promise<User>;
}