import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { CreatePaypalOrderUseCase, CapturePaypalOrderUseCase } from "../../../application/use-cases/paypal.use-case";
import { CreatePaypalOrderDTO } from "../../../application/dtos/payment.dto";

@injectable()
export class PaypalController {
    constructor(
        @inject(CreatePaypalOrderUseCase) private createPaypalOrderUseCase: CreatePaypalOrderUseCase,
        @inject(CapturePaypalOrderUseCase) private capturePaypalOrderUseCase: CapturePaypalOrderUseCase
    ) { }

    public createOrder = async (req: Request, res: Response) => {
        try {
            const dto: CreatePaypalOrderDTO = { clientId: req.body.auth.id, ...req.body };
            const [statusCode, result] = await this.createPaypalOrderUseCase.execute(dto);
            return res.status(statusCode).json(result);
        } catch (error: any) {
            return res.status(error.code || 500).json({ message: error.message });
        }
    }

    public captureOrder = async (req: Request, res: Response) => {
        try {
            const { orderId } = req.params;
            const [statusCode, result] = await this.capturePaypalOrderUseCase.execute(orderId);
            return res.status(statusCode).json(result);
        } catch (error: any) {
            return res.status(error.code || 500).json({ message: error.message });
        }
    }
}
