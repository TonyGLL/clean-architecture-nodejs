import { inject, injectable } from "inversify";
import { ICouponsRepository } from "../../../../domain/repositories/coupons.repository";
import { Coupon } from "../../../../domain/entities/coupon";
import { PoolClient } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";
import { HttpStatusCode } from "../../../../domain/shared/http.status";
import { HttpError } from "../../../../domain/errors/http.error";
import { CouponWithCount } from "../../../../application/dtos/coupons.dto";

@injectable()
export class PostgresCouponsRepository implements ICouponsRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: PoolClient
    ) { }

    public async getCouponByCode(code: string): Promise<Coupon | null> {
        try {
            const query = `
                SELECT
                    id,
                    code,
                    discount_type,
                    discount_value::float AS discount_value,
                    min_order_amount::float AS min_order_amount,
                    max_discount::float AS max_discount,
                    usage_limit::int AS usage_limit,
                    per_client_limit::int AS per_client_limit,
                    valid_from,
                    valid_until,
                    active,
                    created_at,
                    updated_at
                FROM coupons
                WHERE code = $1;
            `;
            const { rows } = await this.pool.query<Coupon>(query, [code]);
            if (rows.length === 0) {
                return null;
            }
            return rows[0];
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error getting coupon by code');
        }
    }

    public async createCoupon(coupon: Coupon): Promise<void> {
        try {
            const query = `
                INSERT INTO coupons (
                    code,
                    discount_type,
                    discount_value,
                    min_order_amount,
                    max_discount,
                    usage_limit,
                    per_client_limit,
                    valid_from,
                    valid_until
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `;
            const values = [
                coupon.code,
                coupon.discount_type,
                coupon.discount_value,
                coupon.min_order_amount,
                coupon.max_discount,
                coupon.usage_limit,
                coupon.per_client_limit,
                coupon.valid_from,
                coupon.valid_until
            ];
            await this.pool.query(query, values);
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error creating coupon');
        }
    }

    public async updateCoupon(couponId: number, coupon: Partial<Coupon>): Promise<void> {
        try {
            const fields = Object.keys(coupon);
            const values = Object.values(coupon);
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

            const query = `
                UPDATE coupons
                SET ${setClause}
                WHERE id = $${fields.length + 1};
            `;
            await this.pool.query<Coupon>(query, [...values, couponId]);
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error updating coupon');
        }
    }

    public async getCoupons({ page = 0, limit = 10, search = '' }): Promise<CouponWithCount> {
        try {
            const offset = (page - 1) * limit;

            const countQuery = `
                SELECT COUNT(*) AS total
                FROM coupons
                WHERE code ILIKE '%' || $1 || '%'
                OR discount_type ILIKE '%' || $1 || '%';
            `;

            const couponsQuery = `
                SELECT
                    id,
                    code,
                    discount_type,
                    discount_value::float AS discount_value,
                    min_order_amount::float AS min_order_amount,
                    max_discount::float AS max_discount,
                    usage_limit::int AS usage_limit,
                    per_client_limit::int AS per_client_limit,
                    valid_from,
                    valid_until,
                    active,
                    created_at,
                    updated_at
                FROM coupons
                WHERE code ILIKE '%' || $1 || '%'
                OR discount_type ILIKE '%' || $1 || '%'
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3;
            `;

            // Ejecutar ambos queries en paralelo
            const [countResult, couponsResult] = await Promise.all([
                this.pool.query<{ total: string }>(countQuery, [search]),
                this.pool.query<Coupon>(couponsQuery, [search, limit, offset])
            ]);

            const total = parseInt(countResult.rows[0].total, 10);

            return {
                coupons: couponsResult.rows,
                total
            };
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : 'Error getting coupons');
        }
    }
}