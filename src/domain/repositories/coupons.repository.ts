import { Coupon } from "../entities/coupon";

/**
 * @file coupons.repository.ts
 * @desc Interface for the coupons repository
 */
export interface ICouponsRepository {

    /**
     * @method getCoupons
     * @returns {Promise<Coupon[]>}
     * @desc Retrieves all available coupons.
     */
    getCoupons(): Promise<Coupon[]>;
}