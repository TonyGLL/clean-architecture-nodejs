import { CouponWithCount, GetCouponsDTO } from "../../application/dtos/coupons.dto";
import { Coupon } from "../entities/coupon";

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

    /**
     * @method createCoupon
     * @param {Coupon} coupon - The coupon entity to be created
     * @returns {Promise<void>}
     * @desc Creates a new coupon.
     */
    createCoupon(coupon: Coupon): Promise<void>;

    /**
     * @method updateCoupon
     * @param {string} couponId - The ID of the coupon to be updated
     * @param {Partial<Coupon>} coupon - The coupon entity with updated fields
     * @returns {Promise<Coupon>}
     * @desc Updates an existing coupon.
     */
    updateCoupon(couponId: string, coupon: Partial<Coupon>): Promise<Coupon>;
}