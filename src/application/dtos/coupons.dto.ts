import { Coupon } from "../../domain/entities/coupon";

export interface GetCouponsDTO {
    page: number;
    limit: number;
    search?: string;
}

export interface CouponWithCount {
    coupons: Coupon[];
    total: number;
}