import { injectable, inject } from "inversify";
import { Pool } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { IProductsRepository } from "../../../../domain/repositories/products.repository";
import { Product } from "../../../../domain/entities/product";
import { HttpError } from "../../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../../domain/shared/http.status";

@injectable()
export class PostgresProductsRepository implements IProductsRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async searchProducts(term: string): Promise<Product[]> {
        try {
            const text = `
                SELECT
                    p.id,
                    p.name,
                    p.description,
                    p.price::float,
                    p.image,
                    p.sku,
                    COUNT(r.id)::int AS reviews,
                    COALESCE(AVG(r.rating), 0)::int AS rating
                FROM products p
                LEFT JOIN reviews r ON p.id = r.product_id
                WHERE (p.name ILIKE '%' || $1 || '%' OR p.description ILIKE '%' || $1 || '%')
                GROUP BY p.id
                ORDER BY p.price DESC;
            `;
            const query = {
                text,
                values: [term ?? '']
            }
            const { rows } = await this.pool.query<Product>(query);
            return rows;
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error searching products');
        }
    }

    public async getProductsByCategory(categoryId: number): Promise<Product[]> {
        try {
            const text = `
                SELECT
                    p.id,
                    p.name,
                    p.description,
                    p.price,
                    p.stock,
                    p.image,
                    p.sku,
                    COUNT(r.id)::int AS reviews,
                    COALESCE(AVG(r.rating), 0)::int AS rating
                FROM products p
                JOIN product_categories pc ON p.id = pc.product_id
                LEFT JOIN reviews r ON p.id = r.product_id
                WHERE pc.category_id = $1
                GROUP BY p.id;
            `;
            const query = {
                text,
                values: [categoryId]
            }
            const { rows } = await this.pool.query<Product>(query);
            return rows;
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error getting products by category');
        }
    }

    public async getProductDetails(productId: string): Promise<Product> {
        try {
            const text = `
                SELECT
                    p.*,
                    p.price::float,
                    c.id AS category_id,
                    c.name AS category_name,
                    c.description AS category_description,
                    COUNT(r.id)::int AS reviews,
                    COALESCE(AVG(r.rating), 0)::int AS rating
                FROM products p
                LEFT JOIN product_categories pc ON p.id = pc.product_id
                LEFT JOIN categories c ON pc.category_id = c.id
                LEFT JOIN reviews r ON p.id = r.product_id
                WHERE p.id = $1
                GROUP BY p.id, c.id;
            `;
            const query = {
                text,
                values: [productId]
            }
            const { rows } = await this.pool.query<Product>(query);
            if (rows.length === 0) {
                throw new HttpError(HttpStatusCode.NOT_FOUND, `Product with ID ${productId} not found`);
            }
            return rows[0];
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error getting product details');
        }
    }

    public async upsertProductsWithCategories(products: Product[]): Promise<void> {
        await this.pool.query('SELECT * FROM upsert_products_with_categories($1)', [JSON.stringify(products)]);
    }
}