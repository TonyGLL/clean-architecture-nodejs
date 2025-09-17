import { NextFunction, Request, Response } from "express";
import { GetAllOrdersUseCase } from "../../../application/use-cases/order.use-case";
import { injectable, inject } from "inversify";
import { GetAllOrdersDTO } from "../../../application/dtos/order.dto";

@injectable()
export class OrdersController {
    constructor(
        @inject(GetAllOrdersUseCase) private getAllOrdersUseCase: GetAllOrdersUseCase) { }

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
}