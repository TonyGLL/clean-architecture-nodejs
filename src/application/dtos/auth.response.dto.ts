import { User } from "../../domain/entities/user";

export type AuthResponseDTO = {
    user: Omit<User, 'password'>;
    token: string;
}