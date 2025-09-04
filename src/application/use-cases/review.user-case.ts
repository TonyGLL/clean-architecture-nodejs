import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IReviewsRepository } from "../../domain/repositories/reviews.repository";
import { GetProductReviewsDTO } from "../dtos/review.dto";
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