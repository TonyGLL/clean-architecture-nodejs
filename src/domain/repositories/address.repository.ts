import { Address } from "../entities/address";

/**
 * @interface IAddressRepository
 * @desc Interface for the address repository
 */
export interface IAddressRepository {

    /**
     * @method create
     * @param {number} clientId - The ID of the client.
     * @param {Omit<Address, 'id'>} address - The address data.
     * @returns {Promise<Address>}
     * @desc Creates a new address for a client.
     */
    create(clientId: number, address: Omit<Address, 'id'>): Promise<Address>;

    /**
     * @method findById
     * @param {number} id - The ID of the address.
     * @returns {Promise<Address | null>}
     * @desc Finds an address by its ID.
     */
    findById(id: number): Promise<Address | null>;

    /**
     * @method findByClientId
     * @param {number} clientId - The ID of the client.
     * @returns {Promise<Address[]>}
     * @desc Finds all addresses for a given client.
     */
    findByClientId(clientId: number): Promise<Address[]>;

    /**
     * @method update
     * @param {number} id - The ID of the address to update.
     * @param {Partial<Omit<Address, 'id'>>} address - The new address data.
     * @returns {Promise<Address>}
     * @desc Updates an existing address.
     */
    update(id: number, address: Partial<Omit<Address, 'id'>>): Promise<Address>;

    /**
     * @method delete
     * @param {number} id - The ID of the address to delete.
     * @returns {Promise<void>}
     * @desc Deletes an address by its ID.
     */
    delete(id: number): Promise<void>;

    /**
     * @method setDefault
     * @param {number} clientId - The ID of the client.
     * @param {number} addressId - The ID of the address to set as default.
     * @returns {Promise<void>}
     * @desc Sets an address as the default for a client.
     */
    setDefault(clientId: number, addressId: number): Promise<void>;
}