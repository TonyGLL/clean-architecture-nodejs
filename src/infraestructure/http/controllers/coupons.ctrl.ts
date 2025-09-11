import { injectable, inject } from "inversify";
import { NextFunction, Request, Response } from "express";
import { GetCouponsUseCase } from "../../../application/use-cases/coupons.use-case";

@injectable()
export class CouponsController {
    constructor(
        @inject(GetCouponsUseCase) private getCouponsUseCase: GetCouponsUseCase,
    ) { }

    public getCoupons = async (_: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const [status, data] = await this.getCouponsUseCase.execute();
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}