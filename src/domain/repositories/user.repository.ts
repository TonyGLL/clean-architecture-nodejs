import { PoolClient } from "pg";
import { User } from "../entities/user";

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    saveUser(user: Omit<User, 'id'>, client: PoolClient): Promise<User | null>;
    saveUserPassword(userId: number, password: string, client: PoolClient): Promise<void>;
    updatePassword(userId: number, password: string): Promise<void>;
}