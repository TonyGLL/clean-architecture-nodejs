import { PoolClient } from "pg";
import { Cart } from "../entities/cart";
import { AddProductToCartDTOPayload } from "../../application/dtos/cart.dto";

export interface ICartRepository {
    createCartFromLogin(clientId: number, clientPool: PoolClient): Promise<void>;
    getCartDetails(clientId: number): Promise<Cart>;
    addProductToCart(product: AddProductToCartDTOPayload): Promise<boolean>;
    deleteProductFromCart(clientId: number, productId: number): Promise<void>;
    clearCart(clientId: number): Promise<void>;
}