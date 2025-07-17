import { PoolClient } from 'pg';
import { GetUserDetailsResponseDTO, GetUsersDTO, GetUsersResponseDTO, UpdateUserDTO } from '../../application/dtos/user.dto';
import { User } from '../entities/user';

/**
 * @interface IUserRepository
 * @desc Interface for user repository
 */
export interface IUserRepository {
    /**
     * @method getUsers
     * @param {GetUsersDTO} filters
     * @returns {Promise<GetUsersResponseDTO>}
     * @desc Get all users
     */
    getUsers(filters: GetUsersDTO): Promise<GetUsersResponseDTO>;

    /**
     * @method getUserDetailsById
     * @param {number} id
     * @returns {Promise<GetUserDetailsResponseDTO | null>}
     * @desc Get user details by ID
     */
    getUserDetailsById(id: number): Promise<GetUserDetailsResponseDTO | null>;

    /**
     * @method findById
     * @param {number} id
     * @returns {Promise<User | null>}
     * @desc Find a user by ID
     */
    findById(id: number): Promise<User | null>;

    /**
     * @method findByEmail
     * @param {string} email
     * @returns {Promise<User | null>}
     * @desc Find a user by email
     */
    findByEmail(email: string): Promise<User | null>;

    /**
     * @method create
     * @param {User} user
     * @param {PoolClient} client
     * @returns {Promise<User>}
     * @desc Create a new user
     */
    create(user: User, client: PoolClient): Promise<User>;

    /**
     * @method update
     * @param {number} id
     * @param {Partial<UpdateUserDTO>} user
     * @param {PoolClient} client
     * @returns {Promise<void>}
     * @desc Update a user
     */
    update(id: number, user: Partial<UpdateUserDTO>, client: PoolClient): Promise<void>;

    /**
     * @method delete
     * @param {number} id
     * @param {PoolClient} client
     * @returns {Promise<void>}
     * @desc Delete a user
     */
    delete(id: number, client: PoolClient): Promise<void>;

    /**
     * @method updatePassword
     * @param {number} userId
     * @param {string} hash
     * @param {PoolClient} client
     * @returns {Promise<void>}
     * @desc Update user password
     */
    updatePassword(userId: number, hash: string, client: PoolClient): Promise<void>;
}
