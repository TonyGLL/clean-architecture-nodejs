import { injectable, inject } from "inversify";
import { GetProductDetailsUseCase, GetProductsByCategoryUseCase, SearchProductsUseCase } from "../../../application/use-cases/products.use-case";
import { NextFunction, Request, Response } from "express";
import { IGetProductsByCategoryDTO, ISearchProductsDTO } from "../../../application/dtos/products.dto";

@injectable()
export class ProductsController {
    constructor(
        @inject(SearchProductsUseCase) private searchProductsUseCase: SearchProductsUseCase,
        @inject(GetProductsByCategoryUseCase) private getProductsByCategoryUseCase: GetProductsByCategoryUseCase,
        @inject(GetProductDetailsUseCase) private getProductDetailsUseCase: GetProductDetailsUseCase
    ) { }

    public searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { search, page, limit } = req.query as { search?: string, page: string, limit: string };

            const dto: ISearchProductsDTO = {
                limit: +limit,
                page: +page,
                search
            };
            const [status, result] = await this.searchProductsUseCase.execute(dto);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public getProductDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { productId: id } = req.params as { productId: string };
            const [status, data] = await this.getProductDetailsUseCase.execute(+id);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public getProductsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { categoryId: id } = req.params as { categoryId: string };
            const { page, limit } = req.query as { page: string, limit: string };
            const dto: IGetProductsByCategoryDTO = {
                categoryId: +id,
                limit: +limit,
                page: +page
            };
            const [status, data] = await this.getProductsByCategoryUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}