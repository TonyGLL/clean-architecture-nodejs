import { inject, injectable } from "inversify";
import { PoolClient } from "pg";
import { ICartRepository } from "../../../../domain/repositories/cart.repository";
import { Cart } from "../../../../domain/entities/cart";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { AddProductToCartDTOPayload } from "../../../../application/dtos/cart.dto";

@injectable()
export class PostgresCartRepository implements ICartRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: PoolClient
    ) { }

    updateCartStatus(cartId: number, status: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    updateCartPaymentIntent(cartId: number, paymentIntentId: string | null): Promise<void> {
        throw new Error("Method not implemented.");
    }
    findCartByPaymentIntent(paymentIntentId: string): Promise<Cart | null> {
        throw new Error("Method not implemented.");
    }
    getOrCreateActiveCartByClientId(clientId: number): Promise<Cart> {
        throw new Error("Method not implemented.");
    }

    public async addProductToCart(product: AddProductToCartDTOPayload): Promise<boolean> {
        const text = `
                INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
                VALUES (
                    (SELECT id FROM shopping_carts WHERE client_id = $1 AND status = 'active'),
                    $2, $3, $4
                )
                ON CONFLICT (cart_id, product_id) DO UPDATE
                SET quantity = cart_items.quantity + EXCLUDED.quantity,
                    unit_price = EXCLUDED.unit_price;
            `;
        const query = {
            text,
            values: [product.clientId, product.productId, product.quantity, product.unitPrice]
        };
        await this.pool.query(query);
        return true;
    }

    public async getCartDetails(clientId: number): Promise<Cart> {
        const text = `
            SELECT
                sc.id AS cart_id,
                sc.client_id,
                sc.created_at AS cart_created_at,
                sc.status,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', ci.product_id,
                            'quantity', ci.quantity,
                            'unit_price', ci.unit_price,
                            'added_at', ci.added_at,

                            -- Datos del producto
                            'name', p.name,
                            'description', p.description,
                            'price', p.price,
                            'stock', p.stock,
                            'sku', p.sku,
                            'image', p.image,

                            -- Datos de la categoría
                            'category_id', c.id,
                            'category_name', c.name,
                            'category_description', c.description
                        )
                    ) FILTER (WHERE ci.id IS NOT NULL),
                    '[]'
                ) AS items
            FROM shopping_carts sc
            LEFT JOIN cart_items ci ON ci.cart_id = sc.id
            LEFT JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_categories pc ON pc.product_id = p.id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE sc.client_id = $1 AND sc.status = 'active'
            GROUP BY sc.id;
        `;
        const query = {
            text,
            values: [clientId]
        };
        const result = await this.pool.query(query);
        const { cart_id, client_id, cart_created_at, items, status } = result.rows[0];
        const cart = new Cart(cart_id, client_id, status, cart_created_at, items || []);
        if (items.length) {
            cart.calculateSubTotal(items);
            cart.calculateTaxes();
            cart.calculateTotal();
        }
        return cart;
    }

    public async createCartFromLogin(clientId: number, client: PoolClient): Promise<void> {
        const text = `
            INSERT INTO shopping_carts (client_id)
            SELECT $1
            WHERE NOT EXISTS (
                SELECT 1
                FROM shopping_carts
                WHERE client_id = $1
                AND status = 'active'
            )
            RETURNING id;
        `;
        const query = {
            text,
            values: [clientId]
        };
        await client.query(query);
    }

    public async deleteProductFromCart(clientId: number, productId: number): Promise<void> {
        const text = `
            DELETE FROM cart_items
            WHERE cart_id = (SELECT id FROM shopping_carts WHERE client_id = $1 AND status = 'active')
            AND product_id = $2;
        `;
        const query = {
            text,
            values: [clientId, productId]
        };
        await this.pool.query(query);
    }

    public async clearCart(clientId: number): Promise<void> {
        const text = `
            DELETE FROM cart_items
            WHERE cart_id = (SELECT id FROM shopping_carts WHERE client_id = $1 AND status = 'active');
        `;
        const query = {
            text,
            values: [clientId]
        };
        await this.pool.query(query);
    }
}