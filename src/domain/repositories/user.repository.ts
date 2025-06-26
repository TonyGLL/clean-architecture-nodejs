import { PoolClient } from 'pg';
import { GetUsersDTO, GetUsersResponseDTO } from '../../application/dtos/user.dto';
import { User } from '../entities/user';

export interface IUserRepository {
    getUsers(filters: GetUsersDTO): Promise<GetUsersResponseDTO>;
    findById(id: number): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(user: User, client: PoolClient): Promise<User>;
    update(id: number, user: Partial<User>, client: PoolClient): Promise<void>;
    delete(id: number, client: PoolClient): Promise<void>;
    updatePassword(userId: number, hash: string, client: PoolClient): Promise<void>;
}
