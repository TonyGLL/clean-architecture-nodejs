import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { GetClientOrdersUseCase, GetOrderByIdUseCase } from "../../../application/use-cases/order.use-case";

@injectable()
export class ClientOrdersController {
    constructor(
        @inject(GetClientOrdersUseCase) private getClientOrdersUseCase: GetClientOrdersUseCase,
        @inject(GetOrderByIdUseCase) private getOrderByIdUseCase: GetOrderByIdUseCase) { }

    public getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const [statusCode, data] = await this.getClientOrdersUseCase.execute({ clientId: req.user.id });
            res.status(statusCode).json(data);
        } catch (error) {
            next(error);
        }
    }

    public getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const [statusCode, data] = await this.getOrderByIdUseCase.execute({ orderId: Number(req.params.id), clientId: req.user.id });
            res.status(statusCode).json(data);
        } catch (error) {
            next(error);
        }
    }
}
