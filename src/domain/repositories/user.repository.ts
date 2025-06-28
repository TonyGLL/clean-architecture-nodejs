import { PoolClient } from 'pg';
import { GetUserDetailsResponseDTO, GetUsersDTO, GetUsersResponseDTO, UpdateUserDTO } from '../../application/dtos/user.dto';
import { User } from '../entities/user';

export interface IUserRepository {
    getUsers(filters: GetUsersDTO): Promise<GetUsersResponseDTO>;
    getUserDetailsById(id: number): Promise<GetUserDetailsResponseDTO | null>;
    findById(id: number): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(user: User, client: PoolClient): Promise<User>;
    update(id: number, user: Partial<UpdateUserDTO>, client: PoolClient): Promise<void>;
    delete(id: number, client: PoolClient): Promise<void>;
    updatePassword(userId: number, hash: string, client: PoolClient): Promise<void>;
}
