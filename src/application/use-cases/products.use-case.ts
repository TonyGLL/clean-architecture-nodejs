import { inject, injectable } from "inversify";
import { logger } from "../../infraestructure/config/winston";
import { Product } from "../../domain/entities/product";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IProductsRepository } from "../../domain/repositories/products.repository";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { IGetProductsByCategoryDTO, ISearchProductsDTO, ISearchProductsResponseDTO } from "../dtos/products.dto";

@injectable()
export class UpsertProductsWithCategoriesUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(dto: Product[]): Promise<void> {
        logger.info(`[UpsertProductsWithCategoriesUseCase] - Starting to upsert ${dto.length} products`);
        try {
            await this.productsRepository.upsertProductsWithCategories(dto);
        } catch (error) {
            logger.error(`[UpsertProductsWithCategoriesUseCase] - Error upserting products`, { error });
            throw error;
        }
    }
}

@injectable()
export class SearchProductsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(dto: ISearchProductsDTO): Promise<[number, ISearchProductsResponseDTO]> {
        logger.info(`[SearchProductsUseCase] - Starting to search products with query: ${dto}`);
        try {
            const response = await this.productsRepository.searchProducts(dto);

            return [HttpStatusCode.OK, response];
        } catch (error) {
            logger.error(`[SearchProductsUseCase] - Error searching products with query: ${dto}`, { error });
            throw error;
        }
    }
}

@injectable()
export class GetProductsByCategoryUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(filters: IGetProductsByCategoryDTO): Promise<[number, ISearchProductsResponseDTO]> {
        logger.info(`[GetProductsByCategoryUseCase] - Starting to get products for category: ${filters.categoryId}`);
        try {
            return [HttpStatusCode.OK, await this.productsRepository.getProductsByCategory(filters)];
        } catch (error) {
            logger.error(`[GetProductsByCategoryUseCase] - Error getting products for category: ${filters.categoryId}`, { error });
            throw error;
        }
    }
}

@injectable()
export class GetProductDetailsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(productId: number): Promise<[number, Product]> {
        logger.info(`[GetProductDetailsUseCase] - Starting to get details for product: ${productId}`);
        try {
            return [HttpStatusCode.OK, await this.productsRepository.getProductDetails(productId)];
        } catch (error) {
            logger.error(`[GetProductDetailsUseCase] - Error getting details for product: ${productId}`, { error });
            throw error;
        }
    }
}