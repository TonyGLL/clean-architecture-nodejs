import { injectable, inject } from "inversify";
import { GetProductDetailsUseCase, GetProductsByCategoryUseCase, SearchProductsUseCase } from "../../../application/use-cases/products.use-case";
import { NextFunction, Request, Response } from "express";

@injectable()
export class ProductsController {
    constructor(
        @inject(SearchProductsUseCase) private searchProductsUseCase: SearchProductsUseCase,
        @inject(GetProductsByCategoryUseCase) private getProductsByCategoryUseCase: GetProductsByCategoryUseCase,
        @inject(GetProductDetailsUseCase) private getProductDetailsUseCase: GetProductDetailsUseCase
    ) { }

    public searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { q } = req.query as { q: string };
            const [status, result] = await this.searchProductsUseCase.execute(q);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }

    public getProductDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params as { id: string };
            const [status, data] = await this.getProductDetailsUseCase.execute(id);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public getProductsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params as { id: string };
            const [status, data] = await this.getProductsByCategoryUseCase.execute(Number(id));
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}