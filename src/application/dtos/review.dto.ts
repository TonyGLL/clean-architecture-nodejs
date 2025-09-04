import { Review } from "../../domain/entities/review";

export interface GetProductReviewsDTO {
    product_id: number;
    limit: number;
    page: number;
}

export interface CreateReviewDTO extends Pick<Review, 'product_id' | 'client_id' | 'rating' | 'body'> { }