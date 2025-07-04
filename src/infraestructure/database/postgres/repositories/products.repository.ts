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
        const text = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.price::float,
                p.image,
                p.sku
            FROM products p
            WHERE (p.name ILIKE '%' || $1 || '%' OR p.description ILIKE '%' || $1 || '%')
            ORDER BY p.price DESC;
        `;
        const query = {
            text,
            values: [term]
        }
        const { rows } = await this.pool.query<Product>(query);
        return rows;
    }

    public async getProductsByCategory(categoryId: number): Promise<Product[]> {
        const text = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.stock,
                p.image,
                p.sku
            FROM products p
            JOIN product_categories pc ON p.id = pc.product_id
            WHERE pc.category_id = $1;
        `;
        const query = {
            text,
            values: [categoryId]
        }
        const { rows } = await this.pool.query<Product>(query);
        return rows;
    }

    public async getProductDetails(productId: string): Promise<Product> {
        const text = `
            SELECT
                p.*,
                p.price::float,
                c.id AS category_id,
                c.name AS category_name,
                c.description AS category_description
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.id = $1;
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
    }

    public async upsertProductsWithCategories(products: Product[]): Promise<void> {
        await this.pool.query('SELECT * FROM upsert_products_with_categories($1)', [JSON.stringify(products)]);
    }
}