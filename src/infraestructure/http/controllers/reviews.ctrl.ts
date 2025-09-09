import { injectable, inject } from "inversify";
import { ModerateReviewByAdminUseCase, CreateReviewUseCase, DeleteReviewUseCase, GetProductReviewsUseCase, DeleteReviewByAdminUseCase } from "../../../application/use-cases/review.user-case";
import { NextFunction, Request, Response } from "express";
import { CreateReviewDTO, GetProductReviewsDTO } from "../../../application/dtos/review.dto";

@injectable()
export class ReviewsController {
    constructor(
        @inject(GetProductReviewsUseCase) private getProductReviewsUseCase: GetProductReviewsUseCase,
        @inject(CreateReviewUseCase) private createReviewUseCase: CreateReviewUseCase,
        @inject(DeleteReviewUseCase) private deleteReviewUseCase: DeleteReviewUseCase,
        @inject(ModerateReviewByAdminUseCase) private moderateReviewByAdminUseCase: ModerateReviewByAdminUseCase,
        @inject(DeleteReviewByAdminUseCase) private deleteReviewByAdminUseCase: DeleteReviewByAdminUseCase
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

    public createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const client_id = req.user.id;
            const { productId } = req.params as { productId: string };
            const { rating, body } = req.body as { rating: number; body: string };
            const dto: CreateReviewDTO = {
                product_id: +productId,
                rating,
                body,
                client_id
            };
            const [status, data] = await this.createReviewUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const client_id = req.user.id;
            const { reviewId } = req.params as { reviewId: string };
            const [status, data] = await this.deleteReviewUseCase.execute(+reviewId, client_id);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public moderateReviewByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { productId } = req.params as { productId: string };
            const { status } = req.params as { status: string };
            const approved = status === 'approved' ? true : false;
            const [statusCode, data] = await this.moderateReviewByAdminUseCase.execute(+productId, approved);
            res.status(statusCode).json(data);
        } catch (error) {
            next(error);
        }
    }

    public deleteReviewByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { reviewId } = req.params as { reviewId: string };
            const [status, data] = await this.deleteReviewByAdminUseCase.execute(+reviewId);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}