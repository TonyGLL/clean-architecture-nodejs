import { PoolClient } from "pg";
import { Cart } from "../entities/cart";
import { Product } from "../entities/product";

export interface ICartRepository {
    createCartFromLogin(clientId: number, clientPool: PoolClient): Promise<void>;
    getCartDetails(clientId: number): Promise<Cart>;
    addProductToCart(product: Product): Promise<boolean>;
}