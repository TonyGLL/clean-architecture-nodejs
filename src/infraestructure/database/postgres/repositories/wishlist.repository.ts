import { inject, injectable } from "inversify";
import { IWishlistRepository } from "../../../../domain/repositories/wishlist.repository";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { Pool } from "pg";
import { Wishlist } from "../../../../domain/entities/wishlist";

@injectable()
export class PostgresWishlistRepository implements IWishlistRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async deleteWishlist(clientId: number, wishlistId: number): Promise<void> {
        try {
            const query = {
                text: 'UPDATE wishlists SET deleted = TRUE WHERE id = $1 AND client_id = $2',
                values: [wishlistId, clientId]
            };

            await this.pool.query(query);
        } catch (error) {
            throw error;
        }
    }

    public async createWishlist(clientId: number, name: string): Promise<void> {
        try {
            const query = {
                text: 'INSERT INTO wishlists (client_id, name) VALUES ($1, $2)',
                values: [clientId, name]
            };

            await this.pool.query(query);
        } catch (error) {
            throw error;
        }
    }

    public async findByName(clientId: number, name: string): Promise<Wishlist | null> {
        try {
            const query = {
                text: 'SELECT w.id FROM wishlists w WHERE w.client_id = $1 AND w.name = $2 AND w.deleted IS FALSE',
                values: [clientId, name]
            };

            const { rows } = await this.pool.query<Wishlist>(query);
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    public async getWishlistDetails(clientId: number, wishlistId: number): Promise<Wishlist | null> {
        try {
            const query = {
                text: `
                    SELECT
                        w.id,
                        w.name,
                        w.created_at,
                        w.updated_at,

                        -- Products in the cart
                        COALESCE(
                            json_agg(
                                json_build_object(
                                    'id', p.id,

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
                                    'category_description', c.description
                                )
                            ) FILTER (WHERE p.id IS NOT NULL),
                            '[]'::json
                        ) AS items
                    FROM wishlists w
                    LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
                    LEFT JOIN products p ON p.id = wi.product_id
                    LEFT JOIN product_categories pc ON pc.product_id = p.id
                    LEFT JOIN categories c ON pc.category_id = c.id
                    WHERE w.client_id = $1 AND w.id = $2 AND w.deleted IS FALSE
                    GROUP BY w.id, w.name, w.created_at, w.updated_at
                `,
                values: [clientId, wishlistId]
            };

            const { rows } = await this.pool.query<Wishlist>(query);
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    public async findByClientId(clientId: number): Promise<Wishlist[]> {
        try {
            const query = {
                text: `
                    SELECT
                        w.id,
                        w.name,
                        w.created_at,
                        w.updated_at,
                        COUNT(wi.id)::int AS items
                    FROM wishlists w
                    LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
                    WHERE w.client_id = $1 AND w.deleted IS FALSE
                    GROUP BY w.id, w.name, w.created_at, w.updated_at
                    ORDER BY w.created_at DESC
                `,
                values: [clientId]
            };

            const { rows } = await this.pool.query<Wishlist>(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}