import { PoolClient } from "pg";
import { CreateReviewDTO, GetProductReviewsDTO } from "../../application/dtos/review.dto";
import { Review } from "../entities/review";

export interface IReviewsRepository {
    /**
     * @method getReviews
     * @param {GetProductReviewsDTO} filters
     * @returns {Promise<Review[]>}
     * @desc Get all reviews
     */
    getProductReviews(filters: GetProductReviewsDTO): Promise<Review[]>;

    /**
     * @method createReview
     * @param {CreateReviewDTO} review
     * @returns {Promise<void>}
     * @desc Create a new review
     */
    createReview(review: CreateReviewDTO): Promise<void>;

    /**
     * @method updateReview
     * @param {string} review_id
     * @param {Partial<Review>} review
     * @param {PoolClient} client
     * @returns {Promise<void>}
     * @desc Update a review
     */
    updateReview(review_id: string, review: Partial<Review>, client: PoolClient): Promise<void>;

    /**
     * @method deleteReview
     * @param {number} review_id
     * @returns {Promise<void>}
     * @desc Delete a review
     */
    deleteReview(review_id: number): Promise<void>;
}