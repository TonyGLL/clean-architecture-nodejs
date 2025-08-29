import { Wishlist } from "../entities/wishlist";

export interface IWishlistRepository {
    /**
     * @method findByClientId
     * @param {number} clientId
     * @returns {Promise<Wishlist[]>}
     * @desc Find wishlists by client ID
     */
    findByClientId(clientId: number): Promise<Wishlist[]>;

    /**
     * @method getWishlistDetails
     * @param {number} wishlistId
     * @param {number} clientId
     * @returns {Promise<Wishlist | null>}
     * @desc Find a wishlist by its ID
     */
    getWishlistDetails(clientId: number, wishlistId: number): Promise<Wishlist | null>;

    /**
     * @method createWishlist
     * @param {number} clientId
     * @param {string} name
     * @returns {Promise<Wishlist>}
     * @desc Create a new wishlist
     */
    createWishlist(clientId: number, name: string): Promise<void>;

    /**
     * @method findByName
     * @param {number} clientId
     * @param {string} name
     * @returns {Promise<Wishlist | null>}
     * @desc Find a wishlist by its name for a specific client
     */
    findByName(clientId: number, name: string): Promise<Wishlist | null>;

    /**
     * @method deleteWishlist
     * @param {number} clientId
     * @param {number} wishlistId
     * @returns {Promise<void>}
     * @desc Soft delete a wishlist by its ID
     */
    deleteWishlist(clientId: number, wishlistId: number): Promise<void>;
}