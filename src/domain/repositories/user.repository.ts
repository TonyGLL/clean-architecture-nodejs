import { User } from "../entities/user";

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    saveUser(user: Omit<User, 'id'>): Promise<User | null>;
    saveUserPassword(userId: number, password: string): Promise<void>;
}