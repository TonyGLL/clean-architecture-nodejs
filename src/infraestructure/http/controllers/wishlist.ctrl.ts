import { inject, injectable } from "inversify";
import { GetClientWishlistUseCase } from "../../../application/use-cases/wishlist.use-case";
import { NextFunction, Request, Response } from "express";

@injectable()
export class WishlistController {
    constructor(
        @inject(GetClientWishlistUseCase) private getClienWishlistUseCase: GetClientWishlistUseCase,
    ) { }

    public getWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user.id;
            const [status, data] = await this.getClienWishlistUseCase.execute(clientId);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}