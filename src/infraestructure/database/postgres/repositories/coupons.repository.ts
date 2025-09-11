import { inject, injectable } from "inversify";
import { ICouponsRepository } from "../../../../domain/repositories/coupons.repository";
import { Coupon } from "../../../../domain/entities/coupon";
import { PoolClient } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";

@injectable()
export class PostgresCouponsRepository implements ICouponsRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: PoolClient
    ) { }

    getCoupons(): Promise<Coupon[]> {
        throw new Error("Method not implemented.");
    }
}