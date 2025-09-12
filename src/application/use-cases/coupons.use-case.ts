import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { ICouponsRepository } from "../../domain/repositories/coupons.repository";
import { Coupon } from "../../domain/entities/coupon";
import { CouponWithCount, GetCouponsDTO } from "../dtos/coupons.dto";

@injectable()
export class GetCouponsUseCase {

    constructor(
        @inject(DOMAIN_TYPES.ICouponsRepository) private couponsRepository: ICouponsRepository
    ) { }

    public async execute(dto: GetCouponsDTO): Promise<[number, CouponWithCount]> {
        return [HttpStatusCode.OK, await this.couponsRepository.getCoupons(dto)];
    }
}

@injectable()
export class CreateCouponUseCase {

    constructor(
        @inject(DOMAIN_TYPES.ICouponsRepository) private couponsRepository: ICouponsRepository
    ) { }

    public async execute(coupon: Partial<Coupon>): Promise<[number, object]> {
        await this.couponsRepository.createCoupon(coupon);
        return [HttpStatusCode.CREATED, { message: 'Coupon created successfully' }];
    }
}

@injectable()
export class UpdateCouponUseCase {

    constructor(
        @inject(DOMAIN_TYPES.ICouponsRepository) private couponsRepository: ICouponsRepository
    ) { }

    public async execute(couponId: number, coupon: Partial<Coupon>): Promise<[number, object]> {
        await this.couponsRepository.updateCoupon(couponId, coupon);
        return [HttpStatusCode.NO_CONTENT, { message: 'Coupon updated successfully' }];
    }
}