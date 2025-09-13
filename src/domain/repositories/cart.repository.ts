import { PoolClient } from "pg";
import { Cart } from "../entities/cart";
import { AddProductToCartDTOPayload } from "../../application/dtos/cart.dto";

/**
 * @interface ICartRepository
 * @desc Interface for cart repository
 */
export interface ICartRepository {
    /**
     * @method createCartFromLogin
     * @param {number} clientId
     * @param {PoolClient} [clientPool]
     * @returns {Promise<void>}
     * @desc Create a cart for a client upon login
     */
    createCartFromLogin(clientId: number, clientPool?: PoolClient): Promise<void>;

    /**
     * @method getCartDetails
     * @param {number} clientId
     * @param {number} [cartId]
     * @returns {Promise<Cart | null>}
     * @desc Get cart details
     */
    getCartDetails(clientId: number, cartId?: number): Promise<Cart | null>;

    /**
     * @method addProductToCart
     * @param {AddProductToCartDTOPayload} product
     * @returns {Promise<boolean>}
     * @desc Add a product to the cart
     */
    addProductToCart(product: AddProductToCartDTOPayload): Promise<boolean>;

    /**
     * @method deleteProductFromCart
     * @param {number} clientId
     * @param {number} productId
     * @returns {Promise<void>}
     * @desc Delete a product from the cart
     */
    deleteProductFromCart(clientId: number, productId: number): Promise<void>;

    /**
     * @method clearCart
     * @param {number} clientId
     * @param {number} [cartId]
     * @returns {Promise<void>}
     * @desc Clear the cart
     */
    clearCart(clientId: number, cartId?: number): Promise<void>;

    /**
     * @method updateCartStatus
     * @param {number} cartId
     * @param {string} status
     * @param {PoolClient} poolClient
     * @returns {Promise<void>}
     * @desc Update cart status
     */
    updateCartStatus(cartId: number, status: string, poolClient: PoolClient): Promise<void>;

    /**
     * @method updateCartPaymentIntent
     * @param {number} cartId
     * @param {(string | null)} paymentIntentId
     * @returns {Promise<void>}
     * @desc Update cart payment intent
     */
    updateCartPaymentIntent(cartId: number, paymentIntentId: string | null): Promise<void>;

    /**
     * @method findCartByPaymentIntent
     * @param {string} paymentIntentId
     * @returns {Promise<Cart | null>}
     * @desc Find a cart by payment intent
     */
    findCartByPaymentIntent(paymentIntentId: string): Promise<Cart | null>;

    /**
     * @method getOrCreateActiveCartByClientId
     * @param {number} clientId
     * @returns {Promise<Cart>}
     * @desc Get or create an active cart for a client
     */
    getOrCreateActiveCartByClientId(clientId: number): Promise<Cart>;

    /**
     * @method linkAddressToCart
     * @param {number} addressId
     * @param {number} clientId
     * @returns {Promise<Cart>}
     * @desc Link a valid client address to his current cart
     */
    linkAddressToCart(addressId: number, clientId: number): Promise<void>;

    /**
     * @method applyCouponToCart
     * @param {number} couponId - The id of the coupon to be applied
     * @param {number} cartId - The ID of the cart to which the coupon will be applied
     * @returns {Promise<void>}
     * @desc Applies a coupon to a cart.
     */
    applyCouponToCart(couponId: number, cartId: number): Promise<void>;

    /**
     * @method removeCouponFromCart
     * @param {number} cartId - The ID of the cart from which the coupon will be removed
     * @returns {Promise<void>}
     * @desc Removes a coupon from a cart.
     */
    removeCouponFromCart(cartId: number): Promise<void>;
}