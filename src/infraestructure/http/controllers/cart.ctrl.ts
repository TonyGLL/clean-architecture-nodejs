import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { GetCartUseCase } from "../../../application/use-cases/cart.use-case";

@injectable()
export class CartController {
    constructor(
        @inject(GetCartUseCase) private getCartUseCase: GetCartUseCase
    ) { }

    public getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.user as { id: number };
            const [status, result] = await this.getCartUseCase.execute(id);
            res.status(status).json(result);
        } catch (error) {
            next(error);
        }
    }
}