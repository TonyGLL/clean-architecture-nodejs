import { injectable, inject } from "inversify";
import { Pool, PoolClient } from "pg";
import { IReviewsRepository } from "../../../../domain/repositories/reviews.repository";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { GetProductReviewsDTO, CreateReviewDTO } from "../../../../application/dtos/review.dto";
import { Review } from "../../../../domain/entities/review";

@injectable()
export class PostgresReviewsRepository implements IReviewsRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async getProductReviews(filters: GetProductReviewsDTO): Promise<Review[]> {
        try {
            const text = `
                SELECT id, product_id, client_id, rating, body, created_at, updated_at
                FROM reviews
                WHERE product_id = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            `;
            const values = [filters.product_id, filters.limit, filters.page * filters.limit];
            const { rows } = await this.pool.query<Review>(text, values);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    public async createReview(review: CreateReviewDTO, client: PoolClient): Promise<Review> {
        throw new Error("Method not implemented.");
    }

    public async updateReview(review_id: string, review: Partial<Review>, client: PoolClient): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async deleteReview(review_id: string, client: PoolClient): Promise<void> {
        throw new Error("Method not implemented.");
    }
}