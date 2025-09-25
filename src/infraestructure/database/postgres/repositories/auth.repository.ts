import { inject, injectable } from "inversify";
import { IAuthRepository } from "../../../../domain/repositories/auth.repository";
import { Client } from "../../../../domain/entities/client";
import { Pool, PoolClient } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { HttpStatusCode } from "../../../../domain/shared/http.status";
import { HttpError } from "../../../../domain/errors/http.error";

@injectable()
export class PostgresAuthRepository implements IAuthRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async updateLastAccess(clientId: number, client: PoolClient): Promise<void> {
        try {
            const query = {
                text: "UPDATE clients SET last_access = NOW() WHERE id = $1",
                values: [clientId]
            }
            await client.query(query);
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error updating last access time');
        }
    }

    public async findByEmail(email: string): Promise<Client | null> {
        const query = {
            text: 'SELECT c.*, p.hash as password FROM clients c INNER JOIN client_passwords p ON p.client_id = c.id WHERE c.email = $1 AND c.deleted IS FALSE',
            values: [email]
        }
        const res = await this.pool.query(query);
        if (!res.rows.length) return null;

        const { id, name, last_name, birth_date, phone, password } = res.rows[0];
        return new Client(id, name, last_name, email, birth_date, phone, password);
    }

    public async saveClient(userClient: Omit<Client, "id">, client: PoolClient): Promise<Client | null> {
        const query = {
            text: "INSERT INTO clients (name, last_name, email, birth_date, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            values: [userClient.name, userClient.last_name, userClient.email, userClient.birth_date, userClient.phone]
        }
        const res = await client.query(query);
        if (!res.rows.length) return null;

        const { id, name, last_name, email, role, age, phone } = res.rows[0];
        return new Client(id, name, last_name, email, role, age, phone);
    }

    public async saveClientPassword(clientId: number, password: string, client: PoolClient): Promise<void> {
        const query = {
            text: "INSERT INTO client_passwords (client_id, hash) VALUES ($1, $2)",
            values: [clientId, password]
        }
        await client.query(query);
    }

    public async updatePassword(clientId: number, password: string): Promise<void> {
        const query = {
            text: "UPDATE client_passwords SET hash = $2 WHERE client_id = $1",
            values: [clientId, password]
        }
        await this.pool.query(query);
    }
}