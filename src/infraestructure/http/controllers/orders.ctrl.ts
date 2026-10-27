import { NextFunction, Request, Response } from "express";
import { GetAllOrdersUseCase, GetOrderByIdUseCase, UpdateOrderStatusUseCase } from "../../../application/use-cases/order.use-case";
import { injectable, inject } from "inversify";
import { GetAllOrdersDTO } from "../../../application/dtos/order.dto";

@injectable()
export class OrdersController {
    constructor(
        @inject(GetAllOrdersUseCase) private getAllOrdersUseCase: GetAllOrdersUseCase,
        @inject(GetOrderByIdUseCase) private getOrderByIdUseCase: GetOrderByIdUseCase,
        @inject(UpdateOrderStatusUseCase) private updateOrderStatusUseCase: UpdateOrderStatusUseCase) { }

    public getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit, search, status, start_date, end_date } = req.query;

            const dto: GetAllOrdersDTO = {
                page: page ? parseInt(page as string, 10) : 1,
                limit: limit ? parseInt(limit as string, 10) : 10,
                search: search ? (search as string) : undefined,
                status: status ? (status as string) : undefined,
                start_date: start_date ? (start_date as string) : undefined,
                end_date: end_date ? (end_date as string) : undefined,
            };

            const [statusCode, data] = await this.getAllOrdersUseCase.execute(dto);
            res.status(statusCode).json(data);
        } catch (error) {
            next(error);
        }
    }

    public getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const [statusCode, data] = await this.getOrderByIdUseCase.execute({ orderId: Number(req.params.id) });
            res.status(statusCode).json(data);
        } catch (error) {
            next(error);
        }
    }

    public updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const [statusCode, data] = await this.updateOrderStatusUseCase.execute({ orderId: Number(req.params.id), status: req.body.status });
            res.status(statusCode).json(data);
        } catch (error) {
            next(error);
        }
    }
}
