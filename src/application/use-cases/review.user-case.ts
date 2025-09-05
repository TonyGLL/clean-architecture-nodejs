import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IReviewsRepository } from "../../domain/repositories/reviews.repository";
import { CreateReviewDTO, GetProductReviewsDTO } from "../dtos/review.dto";
import { Review } from "../../domain/entities/review";
import { HttpStatusCode } from "../../domain/shared/http.status";

@injectable()
export class GetProductReviewsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IReviewsRepository) private reviewsRepository: IReviewsRepository
    ) { }

    public async execute(dto: GetProductReviewsDTO): Promise<[number, Review[]]> {
        const reviews = await this.reviewsRepository.getProductReviews(dto);
        return [HttpStatusCode.OK, reviews];
    }
}

@injectable()
export class CreateReviewUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IReviewsRepository) private reviewsRepository: IReviewsRepository
    ) { }

    public async execute(dto: CreateReviewDTO): Promise<[number, { message: string }]> {
        await this.reviewsRepository.createReview(dto);
        return [HttpStatusCode.OK, { message: 'Review created successfully' }];
    }
}

@injectable()
export class DeleteReviewUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IReviewsRepository) private reviewsRepository: IReviewsRepository
    ) { }

    public async execute(review_id: number, client_id: number): Promise<[number, { message: string }]> {
        await this.reviewsRepository.deleteReview(review_id);
        return [HttpStatusCode.OK, { message: 'Review deleted successfully' }];
    }
}