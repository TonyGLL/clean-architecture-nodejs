import { inject, injectable } from "inversify";
import { IUserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user";
import { TYPES } from "../../ioc/types";
import { Pool } from "pg";
import { HttpError } from "../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../domain/shared/http.status";

@injectable()
export class PostgresUserRepository implements IUserRepository {
    constructor(
        @inject(TYPES.PostgresPool) private pool: Pool
    ) { }

    public async findByEmail(email: string): Promise<User | null> {
        const query = {
            text: 'SELECT * FROM users WHERE email = $1',
            values: [email]
        }
        const res = await this.pool.query(query);
        if (!res.rows.length) return null;

        const { id, name, last_name, role, age, phone } = res.rows[0];
        return new User(id, name, last_name, email, role, age, phone);
    }

    public async saveUser(user: Omit<User, "id">): Promise<User | null> {
        const query = {
            text: "INSERT INTO users u (name, last_name, email, birth_date, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            values: [user.name, user.last_name, user.email, user.birth_date, user.phone]
        }
        const res = await this.pool.query(query);
        if (!res.rows.length) return null;

        const { id, name, last_name, email, role, age, phone } = res.rows[0];
        return new User(id, name, last_name, email, role, age, phone);
    }

    public async saveUserPassword(userId: number, password: string): Promise<void> {
        try {
            const query = {
                text: "INSERT INTO password p (value) VALUES ($2) WHERE p.user_id = $1",
                values: [userId, password]
            }
            await this.pool.query(query);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpError(HttpStatusCode.BAD_REQUEST, error.message);
            }
        }
    }

    public async updatePassword(userId: number, password: string): Promise<void> {
        const query = {
            text: "UPDATE passwords p SET (value = $2) WHERE p.user_id = $1",
            values: [userId, password]
        }
        await this.pool.query(query);
    }
}