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
     * @param {Partial<Coupon>} coupon - The coupon entity to be created
     * @returns {Promise<void>}
     * @desc Creates a new coupon.
     */
    createCoupon(coupon: Partial<Coupon>): Promise<void>;

    /**
     * @method updateCoupon
     * @param {number} couponId - The ID of the coupon to be updated
     * @param {Partial<Coupon>} coupon - The coupon entity with updated fields
     * @returns {Promise<void>}
     * @desc Updates an existing coupon.
     */
    updateCoupon(couponId: number, coupon: Partial<Coupon>): Promise<void>;

    /**
     * @method getCouponByCode
     * @param {string} code - The code of the coupon to be retrieved
     * @returns {Promise<Coupon | null>}
     * @desc Retrieves a coupon by its code.
     */
    getCouponByCode(code: string): Promise<Coupon | null>;

    /**
     * @method getCouponRedemptionCount
     * @param {number} couponId - The ID of the coupon
     * @returns {Promise<number>}
     * @desc Retrieves the total number of times a coupon has been redeemed.
     */
    getCouponRedemptionCount(couponId: number): Promise<number>;

    /**
     * @method getClientCouponRedemptionCount
     * @param {number} couponId - The ID of the coupon
     * @param {number} clientId - The ID of the client
     * @returns {Promise<number>}
     * @desc Retrieves the number of times a specific client has redeemed a specific coupon.
     */
    getClientCouponRedemptionCount(couponId: number, clientId: number): Promise<number>;


    /**     * @method addCouponRedemption
     * @param {number} couponId - The ID of the coupon
     * @param {number} clientId - The ID of the client
     * @param {number} orderId - The ID of the order associated with the redemption
     * @returns {Promise<void>}
     * @desc Records a coupon redemption by a client for a specific order.
     */
    addCouponRedemption(couponId: number, clientId: number, orderId: number): Promise<void>;
}