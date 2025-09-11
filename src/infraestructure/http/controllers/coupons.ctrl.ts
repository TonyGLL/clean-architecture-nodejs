import { injectable, inject } from "inversify";
import { NextFunction, Request, Response } from "express";
import { GetCouponsUseCase } from "../../../application/use-cases/coupons.use-case";
import { GetCouponsDTO } from "../../../application/dtos/coupons.dto";

@injectable()
export class CouponsController {
    constructor(
        @inject(GetCouponsUseCase) private getCouponsUseCase: GetCouponsUseCase,
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
            res.status(201).json({ message: "Coupon created" });
        } catch (error) {
            next(error);
        }
    }

    public updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { couponId } = req.params;
            res.status(200).json({ message: `Coupon ${couponId} updated` });
        } catch (error) {
            next(error);
        }
    }
}