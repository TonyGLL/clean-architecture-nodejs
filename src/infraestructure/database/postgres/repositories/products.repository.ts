import { injectable, inject } from "inversify";
import { Pool } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { IProductsRepository } from "../../../../domain/repositories/products.repository";
import { Product } from "../../../../domain/entities/product";
import { HttpError } from "../../../../domain/errors/http.error";
import { HttpStatusCode } from "../../../../domain/shared/http.status";
import { IGetProductsByCategoryDTO, ISearchProductsDTO, ISearchProductsResponseDTO } from "../../../../application/dtos/products.dto";

@injectable()
export class PostgresProductsRepository implements IProductsRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async searchProducts(filters: ISearchProductsDTO): Promise<ISearchProductsResponseDTO> {
        try {
            const { limit, page, search } = filters;
            const pageNum = Math.max(1, Math.floor(Number(page) || 1));
            const limitNum = Math.max(1, Math.floor(Number(limit) || 10));
            const offset = (pageNum - 1) * limitNum;
            const searchStr = (search || '').trim();

            // base WHERE and params (si hay search)
            let whereClause = '';
            const baseParams: any[] = [];
            if (searchStr.length > 0) {
                whereClause = `WHERE (p.name ILIKE '%' || $1 || '%' OR p.description ILIKE '%' || $1 || '%')`;
                baseParams.push(search);
            }

            // COUNT query (sin LIMIT/OFFSET)
            const countText = `
                SELECT COUNT(*)::int AS total
                FROM products p
                ${whereClause};
            `;

            // Data query — necesitamos índices para LIMIT y OFFSET
            const limitParamIndex = baseParams.length + 1;   // e.g. $1 or $2 dependiendo si search existe
            const offsetParamIndex = baseParams.length + 2;

            const dataText = `
                SELECT
                    p.id,
                    p.name,
                    p.description,
                    p.price::float,
                    p.image,
                    p.sku,
                    COUNT(r.id)::int AS reviews,
                    COALESCE(AVG(r.rating), 0)::float AS rating
                FROM products p
                LEFT JOIN reviews r ON p.id = r.product_id
                ${whereClause}
                GROUP BY p.id
                ORDER BY p.price DESC
                LIMIT $${limitParamIndex}
                OFFSET $${offsetParamIndex};
            `;

            // Params para cada query
            const countParams = [...baseParams]; // si no hay search -> []
            const dataParams = [...baseParams, limitNum, offset];

            // Ejecutar en paralelo
            const [countRes, dataRes] = await Promise.all([
                this.pool.query<{ total: number }>({ text: countText, values: countParams }),
                this.pool.query<Product>({ text: dataText, values: dataParams })
            ]);

            const total = countRes.rows[0] ? Number(countRes.rows[0].total) : 0;
            const products = dataRes.rows;

            return { products, total };
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error searching products');
        }
    }

    public async getProductsByCategory(filters: IGetProductsByCategoryDTO): Promise<ISearchProductsResponseDTO> {
        try {
            const { limit, page, categoryId } = filters;
            const pageNum = Math.max(1, Math.floor(Number(page) || 1));
            const limitNum = Math.max(1, Math.floor(Number(limit) || 10));
            const offset = (pageNum - 1) * limitNum;

            // base WHERE and params (si hay search)
            let whereClause = '';
            const baseParams: any[] = [];
            if (categoryId > 0) {
                whereClause = `WHERE pc.category_id = $1`;
                baseParams.push(categoryId);
            }

            // COUNT query (sin LIMIT/OFFSET)
            const countText = `
                SELECT COUNT(*)::int AS total
                FROM products p
                JOIN product_categories pc ON p.id = pc.product_id
                ${whereClause};
            `;

            // Data query — necesitamos índices para LIMIT y OFFSET
            const limitParamIndex = baseParams.length + 1;   // e.g. $1 or $2 dependiendo si search existe
            const offsetParamIndex = baseParams.length + 2;

            const dataText = `
                SELECT
                    p.id,
                    p.name,
                    p.description,
                    p.price::float,
                    p.image,
                    p.sku,
                    COUNT(r.id)::int AS reviews,
                    COALESCE(AVG(r.rating), 0)::float AS rating
                FROM products p
                JOIN product_categories pc ON p.id = pc.product_id
                LEFT JOIN reviews r ON p.id = r.product_id
                ${whereClause}
                GROUP BY p.id
                ORDER BY p.price DESC
                LIMIT $${limitParamIndex}
                OFFSET $${offsetParamIndex};
            `;

            // Params para cada query
            const countParams = [...baseParams];
            const dataParams = [...baseParams, limitNum, offset];

            // Ejecutar en paralelo
            const [countRes, dataRes] = await Promise.all([
                this.pool.query<{ total: number }>({ text: countText, values: countParams }),
                this.pool.query<Product>({ text: dataText, values: dataParams })
            ]);

            const total = countRes.rows[0] ? Number(countRes.rows[0].total) : 0;
            const products = dataRes.rows;

            return { products, total };
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error getting products by category');
        }
    }

    public async getProductDetails(productId: number): Promise<Product> {
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