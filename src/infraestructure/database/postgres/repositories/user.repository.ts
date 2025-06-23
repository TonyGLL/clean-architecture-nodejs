import { inject, injectable } from "inversify";
import { IUserRepository } from "../../../../domain/repositories/user.repository";
import { User } from "../../../../domain/entities/user";
import { Pool, PoolClient } from "pg";
import { HttpError } from "../../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../../domain/shared/http.status";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";

@injectable()
export class PostgresUserRepository implements IUserRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async findByEmail(email: string): Promise<User | null> {
        const query = {
            text: 'SELECT u.*, p.hash as password FROM users u INNER JOIN passwords p ON p.user_id = u.id WHERE u.email = $1',
            values: [email]
        }
        const res = await this.pool.query(query);
        if (!res.rows.length) return null;

        const { id, name, last_name, birth_date, phone, password } = res.rows[0];
        return new User(id, name, last_name, email, birth_date, phone, password);
    }

    public async saveUser(user: Omit<User, "id">, client: PoolClient): Promise<User | null> {
        const query = {
            text: "INSERT INTO users (name, last_name, email, birth_date, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            values: [user.name, user.last_name, user.email, user.birth_date, user.phone]
        }
        const res = await client.query(query);
        if (!res.rows.length) return null;

        const { id, name, last_name, email, role, age, phone } = res.rows[0];
        return new User(id, name, last_name, email, role, age, phone);
    }

    public async saveUserPassword(userId: number, password: string, client: PoolClient): Promise<void> {
        const query = {
            text: "INSERT INTO passwords (user_id, hash) VALUES ($1, $2)",
            values: [userId, password]
        }
        await client.query(query);
    }

    public async updatePassword(userId: number, password: string): Promise<void> {
        const query = {
            text: "UPDATE passwords SET (hash = $2) WHERE user_id = $1",
            values: [userId, password]
        }
        await this.pool.query(query);
    }
}