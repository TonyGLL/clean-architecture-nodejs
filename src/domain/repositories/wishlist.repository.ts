import { Wishlist } from "../entities/wishlist";

export interface IWishlistRepository {
    /**
     * @method findByClientId
     * @param {number} clientId
     * @returns {Promise<Wishlist[]>}
     * @desc Find wishlists by client ID
     */
    findByClientId(clientId: number): Promise<Wishlist[]>;
}