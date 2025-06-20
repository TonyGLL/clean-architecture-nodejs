import { User } from "../../domain/entities/user";
import { Role } from '../../domain/entities/role';

export type AuthResponseDTO = {
    user: Omit<User, 'password'>;
    token: string;
}