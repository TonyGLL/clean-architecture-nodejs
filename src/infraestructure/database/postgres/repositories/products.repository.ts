import { injectable, inject } from "inversify";
import { Pool } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { IProductsRepository } from "../../../../domain/repositories/products.repository";
import { Product } from "../../../../domain/entities/product";

@injectable()
export class PostegresProductsRepository implements IProductsRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async upsertProductsWithCategories(products: Product[]): Promise<void> {
        console.log(products);
        await this.pool.query('SELECT * FROM upsert_products_with_categories($1)', [products]);
    }
}