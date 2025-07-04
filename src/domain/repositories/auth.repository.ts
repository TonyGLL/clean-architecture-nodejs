import { PoolClient } from "pg";
import { Client } from "../entities/client";

export interface IAuthRepository {
    findByEmail(email: string, client: PoolClient): Promise<Client | null>;
    saveClient(user: Omit<Client, 'id'>, client: PoolClient): Promise<Client | null>;
    saveClientPassword(clientId: number, password: string, client: PoolClient): Promise<void>;
    updatePassword(clientId: number, password: string): Promise<void>;
}