import { Product } from "../entities/product";

export interface IProductsRepository {
    upsertProductsWithCategories(products: Product[]): Promise<void>;
}