import { inject, injectable } from "inversify";
import { IUserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user";
import { TYPES } from "../../ioc/types";
import { Pool } from "pg";

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

        const { id, name, password } = res.rows[0];
        return new User(id, name, email, password);
    }

    public async save(user: Omit<User, "id">): Promise<User> {
        throw new Error("Method not implemented.");
    }
}