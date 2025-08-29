import { inject, injectable } from "inversify";
import { CreateWishlistUseCase, GetClientWishlistDetailsUseCase, GetClientWishlistsUseCase } from "../../../application/use-cases/wishlist.use-case";
import { NextFunction, Request, Response } from "express";
import { CreateWishlistDTO, GetWishlistDetailsDTO } from "../../../application/dtos/wishlist.dto";

@injectable()
export class WishlistController {
    constructor(
        @inject(GetClientWishlistsUseCase) private getClienWishlistsUseCase: GetClientWishlistsUseCase,
        @inject(GetClientWishlistDetailsUseCase) private getClientWishlistDetailsUseCase: GetClientWishlistDetailsUseCase,
        @inject(CreateWishlistUseCase) private createWishlistUseCase: CreateWishlistUseCase,
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
            const [status, data] = await this.getClientWishlistDetailsUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public createWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user.id;
            const dto: CreateWishlistDTO = {
                clientId,
                name: req.body.name
            };
            const [status, data] = await this.createWishlistUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}