import { inject, injectable } from "inversify";
import { PoolClient } from "pg";
import { ICartRepository } from "../../../../domain/repositories/cart.repository";
import { Cart } from "../../../../domain/entities/cart";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { AddProductToCartDTOPayload } from "../../../../application/dtos/cart.dto";
import { HttpStatusCode } from "../../../../domain/shared/http.status";
import { HttpError } from "../../../../domain/errors/http.error";

@injectable()
export class PostgresCartRepository implements ICartRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: PoolClient
    ) { }

    public async applyCouponToCart(couponId: number, cartId: number): Promise<void> {
        try {
            const query = `
                UPDATE shopping_carts
                SET coupon_id = $1
                WHERE id = $2 AND status = 'active';
            `;
            await this.pool.query(query, [couponId, cartId]);
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error applying coupon to cart');
        }
    }

    public async removeCouponFromCart(cartId: number): Promise<void> {
        try {
            const query = `
                UPDATE shopping_carts
                SET coupon_id = NULL
                WHERE id = $1 AND status = 'active';
            `;
            await this.pool.query(query, [cartId]);
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error removing coupon from cart');
        }
    }

    public async updateCartStatus(cartId: number, status: string, poolClient: PoolClient): Promise<void> {
        const text = `
            UPDATE shopping_carts
                SET status = $2 WHERE id = $1;
            `;
        const query = {
            text,
            values: [cartId, status]
        };
        await poolClient.query(query);
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
        try {
            const text = `
                SELECT
                    sc.id AS cart_id,
                    sc.client_id,
                    sc.created_at AS cart_created_at,
                    sc.status,
                    pm.external_payment_id,

                    -- Shipping address (can be NULL if it does not exist)
                    json_build_object(
                        'id', a.id,
                        'address_line1', a.address_line1,
                        'address_line2', a.address_line2,
                        'city', a.city,
                        'state', a.state,
                        'postal_code', a.postal_code,
                        'country', a.country,
                        'is_default', a.is_default
                    ) AS address,

                    -- Coupon applied (can be NULL if it does not exist)
                    cp.code AS coupon_code,
                    cp.discount_type AS coupon_discount_type,
                    cp.discount_value AS coupon_discount_value,

                    -- Products in the cart
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', ci.product_id,
                                'quantity', ci.quantity,
                                'unit_price', ci.unit_price,
                                'added_at', ci.added_at,

                                -- Product data
                                'name', p.name,
                                'description', p.description,
                                'price', p.price,
                                'stock', p.stock,
                                'sku', p.sku,
                                'image', p.image,

                                -- Category data
                                'category_id', c.id,
                                'category_name', c.name,
                                'category_description', c.description,

                                -- Wishlisted status
                                'wishlisted', EXISTS (
                                    SELECT 1
                                    FROM wishlists w
                                    JOIN wishlist_items wi ON w.id = wi.wishlist_id
                                    WHERE w.client_id = sc.client_id
                                    AND wi.product_id = ci.product_id
                                )
                            )
                        ORDER BY ci.added_at
                        ) FILTER (WHERE ci.id IS NOT NULL),
                        '[]'::json
                    ) AS items
                FROM shopping_carts sc
                LEFT JOIN cart_items ci ON ci.cart_id = sc.id
                LEFT JOIN products p ON ci.product_id = p.id
                LEFT JOIN product_categories pc ON pc.product_id = p.id
                LEFT JOIN categories c ON pc.category_id = c.id
                LEFT JOIN payments pm ON pm.cart_id = sc.id
                LEFT JOIN addresses a ON sc.shipping_address_id = a.id
                LEFT JOIN coupons cp ON sc.coupon_id = cp.id
                WHERE sc.client_id = $1 AND sc.status = 'active'
                GROUP BY sc.id, sc.client_id, sc.created_at, sc.status, pm.external_payment_id, a.id, cp.code, cp.discount_type, cp.discount_value;
            `;
            const query = {
                text,
                values: [clientId]
            };
            const result = await this.pool.query(query);
            const { cart_id, client_id, cart_created_at, items, status, external_payment_id, address, wishlisted, coupon_code, coupon_discount_type, coupon_discount_value } = result.rows[0];
            const cart = new Cart(cart_id, client_id, status, cart_created_at, items || [], address, wishlisted);
            cart.setActivePaymentIntenId(external_payment_id);
            if (items.length) {
                cart.calculateSubTotal(items);
                cart.calculateTaxes();
                if (coupon_code && coupon_discount_type && coupon_discount_value) cart.calculateDiscount(coupon_discount_value, coupon_discount_type);
                cart.calculateTotal();
            }
            return cart;
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error getting cart details');
        }
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

    public async linkAddressToCart(addressId: number, clientId: number): Promise<void> {
        const text = `UPDATE shopping_carts SET shipping_address_id = $2 WHERE client_id = $1 AND status = 'active'`;
        const query = {
            text,
            values: [clientId, addressId]
        }
        await this.pool.query(query);
    }
}