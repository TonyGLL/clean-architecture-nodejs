import { injectable, inject } from "inversify";
import { GetProductReviewsUseCase } from "../../../application/use-cases/review.user-case";
import { NextFunction, Request, Response } from "express";
import { GetProductReviewsDTO } from "../../../application/dtos/review.dto";

@injectable()
export class ReviewsController {
    constructor(
        @inject(GetProductReviewsUseCase) private getProductReviewsUseCase: GetProductReviewsUseCase
    ) { }

    public getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { productId } = req.params as { productId: string };
            const { page, limit } = req.query as { page: string; limit: string };
            const dto: GetProductReviewsDTO = {
                product_id: +productId,
                limit: +limit,
                page: +page
            };
            const [status, data] = await this.getProductReviewsUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}