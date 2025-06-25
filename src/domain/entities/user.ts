import { Role } from './role';
import { HttpStatusCode } from "../shared/http.status";
import { HttpError } from "../errors/http.error";
import { IHashingService } from "../services/hashing.service";
import { Client } from './client';

export class User extends Client {
    public roles: Role[];

    constructor(
        id: number | null,
        name: string,
        last_name: string,
        email: string,
        birth_date?: Date,
        phone?: string,
        password?: string,
        created_at?: Date,
        updated_at?: Date,
        roles: Role[] = [] // nueva propiedad
    ) {
        super(id, name, last_name, email, birth_date, phone, password, created_at, updated_at);
        this.roles = roles;
    }
}