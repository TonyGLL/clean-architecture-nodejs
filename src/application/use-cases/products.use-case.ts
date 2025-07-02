import { inject, injectable } from "inversify";
import { Product } from "../../domain/entities/product";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IProductsRepository } from "../../domain/repositories/products.repository";

@injectable()
export class UpsertProductsWithCategoriesUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(dto: Product[]): Promise<void> {
        await this.productsRepository.upsertProductsWithCategories(dto);
    }
}