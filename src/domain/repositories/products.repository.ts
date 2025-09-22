import { IGetProductsByCategoryDTO, ISearchProductsDTO, ISearchProductsResponseDTO } from "../../application/dtos/products.dto";
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
     * @param {ISearchProductsDTO} filters
     * @returns {Promise<ISearchProductsResponseDTO>}
     * @desc Search products by a term
     */
    searchProducts(filters: ISearchProductsDTO): Promise<ISearchProductsResponseDTO>;

    /**
     * @method getProductsByCategory
     * @param {IGetProductsByCategoryDTO} filters
     * @returns {Promise<ISearchProductsResponseDTO>}
     * @desc Get products by category
     */
    getProductsByCategory(filters: IGetProductsByCategoryDTO): Promise<ISearchProductsResponseDTO>;

    /**
     * @method getProductDetails
     * @param {number} productId
     * @returns {Promise<Product>}
     * @desc Get product details
     */
    getProductDetails(productId: number): Promise<Product>;
}