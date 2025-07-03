import { inject, injectable } from "inversify";
import { Product } from "../../domain/entities/product";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IProductsRepository } from "../../domain/repositories/products.repository";
import { HttpStatusCode } from "../../domain/shared/http.status";

@injectable()
export class UpsertProductsWithCategoriesUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(dto: Product[]): Promise<void> {
        await this.productsRepository.upsertProductsWithCategories(dto);
    }
}

@injectable()
export class SearchProductsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(dto: string): Promise<[number, Product[]]> {
        const products = await this.productsRepository.searchProducts(dto);

        return [HttpStatusCode.OK, products];
    }
}

@injectable()
export class GetProductsByCategoryUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(categoryId: number): Promise<[number, Product[]]> {
        return [HttpStatusCode.OK, await this.productsRepository.getProductsByCategory(categoryId)];
    }
}

@injectable()
export class GetProductDetailsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(productId: string): Promise<[number, Product]> {
        return [HttpStatusCode.OK, await this.productsRepository.getProductDetails(productId)];
    }
}