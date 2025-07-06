import { PoolClient } from "pg";
import { Cart } from "../entities/cart";
import { AddProductToCartDTOPayload } from "../../application/dtos/cart.dto";

export interface ICartRepository {
    createCartFromLogin(clientId: number, clientPool?: PoolClient): Promise<number>; // Return cartId
    getCartDetails(clientId: number, cartId?: number): Promise<Cart | null>;
    addProductToCart(product: AddProductToCartDTOPayload): Promise<boolean>;
    deleteProductFromCart(clientId: number, productId: number): Promise<void>;
    clearCart(clientId: number, cartId?: number): Promise<void>;
    updateCartStatus(cartId: number, status: string): Promise<void>;
    updateCartPaymentIntent(cartId: number, paymentIntentId: string | null): Promise<void>;
    findCartByPaymentIntent(paymentIntentId: string): Promise<Cart | null>;
    getOrCreateActiveCartByClientId(clientId: number): Promise<Cart>;
}