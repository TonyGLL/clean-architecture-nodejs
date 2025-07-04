import { inject, injectable } from "inversify";
import { PoolClient } from "pg";
import { ICartRepository } from "../../../../domain/repositories/cart.repository";
import { Cart } from "../../../../domain/entities/cart";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { Product } from "../../../../domain/entities/product";

@injectable()
export class PostgresCartRepository implements ICartRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: PoolClient
    ) { }

    public async addProductToCart(product: Product): Promise<boolean> {
        throw new Error("Method not implemented.");
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
                            'id', ci.id,
                            'product_id', ci.product_id,
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
                            'active', p.active,
                            'deleted', p.deleted,
                            'product_created_at', p.created_at,
                            'product_updated_at', p.updated_at,

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
        return new Cart(cart_id, client_id, status, cart_created_at, items || []);
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
}