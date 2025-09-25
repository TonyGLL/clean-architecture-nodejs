import { PoolClient } from "pg";
import { Client } from "../entities/client";

/**
 * @interface IAuthRepository
 * @desc Interface for authentication repository
 */
export interface IAuthRepository {
    /**
     * @method findByEmail
     * @param {string} email
     * @param {PoolClient} client
     * @returns {Promise<Client | null>}
     * @desc Find a client by email
     */
    findByEmail(email: string, client: PoolClient): Promise<Client | null>;

    /**
     * @method saveClient
     * @param {Omit<Client, 'id'>} user
     * @param {PoolClient} client
     * @returns {Promise<Client | null>}
     * @desc Save a new client
     */
    saveClient(user: Omit<Client, 'id'>, client: PoolClient): Promise<Client | null>;

    /**
     * @method saveClientPassword
     * @param {number} clientId
     * @param {string} password
     * @param {PoolClient} client
     * @returns {Promise<void>}
     * @desc Save client password
     */
    saveClientPassword(clientId: number, password: string, client: PoolClient): Promise<void>;

    /**
     * @method updatePassword
     * @param {number} clientId
     * @param {string} password
     * @returns {Promise<void>}
     * @desc Update client password
     */
    updatePassword(clientId: number, password: string): Promise<void>;

    /**
     * @method updateLastAccess
     * @param {number} clientId
     * @returns {Promise<void>}
     * @desc Update client's last access time
     */
    updateLastAccess(clientId: number, client: PoolClient): Promise<void>;
}