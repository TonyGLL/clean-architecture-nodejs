import { inject, injectable } from "inversify";
import { GetClientWishlistDetailsUseCase, GetClientWishlistsUseCase } from "../../../application/use-cases/wishlist.use-case";
import { NextFunction, Request, Response } from "express";
import { GetWishlistDetailsDTO } from "../../../application/dtos/wishlist.dto";

@injectable()
export class WishlistController {
    constructor(
        @inject(GetClientWishlistsUseCase) private getClienWishlistsUseCase: GetClientWishlistsUseCase,
        @inject(GetClientWishlistDetailsUseCase) private getClienWishlistDetailsUseCase: GetClientWishlistDetailsUseCase,
    ) { }

    public getWishlists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user.id;
            const [status, data] = await this.getClienWishlistsUseCase.execute(clientId);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public getWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user.id;
            const dto: GetWishlistDetailsDTO = {
                clientId,
                wishlistId: parseInt(req.params.id)
            };
            const [status, data] = await this.getClienWishlistDetailsUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}