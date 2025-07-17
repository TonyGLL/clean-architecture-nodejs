import { Product } from "../entities/product";

/**
 * @interface IProductsRepository
 * @desc Interface for products repository
 */
export interface IProductsRepository {
    /**
     * @method upsertProductsWithCategories
     * @param {Product[]} products
     * @returns {Promise<void>}
     * @desc Upsert products with categories
     */
    upsertProductsWithCategories(products: Product[]): Promise<void>;

    /**
     * @method searchProducts
     * @param {string} term
     * @returns {Promise<Product[]>}
     * @desc Search products by a term
     */
    searchProducts(term: string): Promise<Product[]>;

    /**
     * @method getProductsByCategory
     * @param {number} categoryId
     * @returns {Promise<Product[]>}
     * @desc Get products by category
     */
    getProductsByCategory(categoryId: number): Promise<Product[]>;

    /**
     * @method getProductDetails
     * @param {string} productId
     * @returns {Promise<Product>}
     * @desc Get product details
     */
    getProductDetails(productId: string): Promise<Product>;
}