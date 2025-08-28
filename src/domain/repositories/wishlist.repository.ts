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
}