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
     * @method applyCouponToCart
     * @param {string} couponCode - The code of the coupon to be applied
     * @param {number} cartId - The ID of the cart to which the coupon will be applied
     * @returns {Promise<void>}
     * @desc Applies a coupon to a cart.
     */
    applyCouponToCart(couponCode: string, cartId: number): Promise<void>;

    /**
     * @method removeCouponFromCart
     * @param {number} cartId - The ID of the cart from which the coupon will be removed
     * @returns {Promise<void>}
     * @desc Removes a coupon from a cart.
     */
    removeCouponFromCart(cartId: number): Promise<void>;
}