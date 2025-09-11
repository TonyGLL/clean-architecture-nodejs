import { injectable, inject } from "inversify";
import { NextFunction, Request, Response } from "express";
import { CreateCouponUseCase, GetCouponsUseCase, UpdateCouponUseCase } from "../../../application/use-cases/coupons.use-case";
import { GetCouponsDTO } from "../../../application/dtos/coupons.dto";
import { Coupon } from "../../../domain/entities/coupon";

@injectable()
export class CouponsController {
    constructor(
        @inject(GetCouponsUseCase) private getCouponsUseCase: GetCouponsUseCase,
        @inject(CreateCouponUseCase) private createCouponUseCase: CreateCouponUseCase,
        @inject(UpdateCouponUseCase) private updateCouponUseCase: UpdateCouponUseCase
    ) { }

    public getCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit } = req.query as { page: string; limit: string };
            const dto: GetCouponsDTO = {
                limit: +limit,
                page: +page
            };
            const [status, data] = await this.getCouponsUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const couponData: Partial<Coupon> = req.body;
            const [status, data] = await this.createCouponUseCase.execute(couponData);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { couponId } = req.params as { couponId: string };
            const couponData: Partial<Coupon> = req.body;
            const [status, data] = await this.updateCouponUseCase.execute(+couponId, couponData);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}