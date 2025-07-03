import { Product } from "../entities/product";

export interface IProductsRepository {
    upsertProductsWithCategories(products: Product[]): Promise<void>;
    searchProducts(term: string): Promise<Product[]>;
    getProductsByCategory(categoryId: number): Promise<Product[]>;
    getProductDetails(productId: string): Promise<Product>;
}