import { Review } from "../../domain/entities/review";

export interface GetProductReviewsDTO {
    product_id: number;
    limit: number;
    page: number;
}

export interface CreateReviewDTO extends Pick<Review, 'client_id' | 'rating' | 'title' | 'body' | 'title'> { }