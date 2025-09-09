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

    public async moderateReviewByAdmin(review_id: number, status: boolean): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async deleteReviewByAdmin(review_id: number): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async getProductReviews(filters: GetProductReviewsDTO): Promise<Review[]> {
        try {
            const text = `
                SELECT id, product_id, client_id, rating, body, created_at, updated_at
                FROM reviews
                WHERE product_id = $1 AND deleted = FALSE
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

    public async createReview(review: CreateReviewDTO): Promise<void> {
        try {
            const text = `
                INSERT INTO reviews (product_id, client_id, rating, body)
                VALUES ($1, $2, $3, $4)
            `;
            const values = [review.product_id, review.client_id, review.rating, review.body];
            await this.pool.query(text, values);
        } catch (error) {
            throw error;
        }
    }

    public async deleteReview(review_id: number, client_id: number): Promise<void> {
        try {
            const text = `
                UPDATE reviews
                SET deleted = TRUE
                WHERE id = $1 AND client_id = $2
            `;
            const values = [review_id, client_id];
            await this.pool.query(text, values);
        } catch (error) {
            throw error;
        }
    }
}