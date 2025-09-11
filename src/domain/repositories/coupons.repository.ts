import { CouponWithCount, GetCouponsDTO } from "../../application/dtos/coupons.dto";

/**
 * @file coupons.repository.ts
 * @desc Interface for the coupons repository
 */
export interface ICouponsRepository {

    /**
     * @method getCoupons
     * @param {GetCouponsDTO} dto - Data transfer object containing pagination and filter information
     * @returns {Promise<CouponWithCount>}
     * @desc Retrieves all available coupons.
     */
    getCoupons(dto: GetCouponsDTO): Promise<CouponWithCount>;
}