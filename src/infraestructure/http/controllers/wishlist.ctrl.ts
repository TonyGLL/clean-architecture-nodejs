import { inject, injectable } from "inversify";
import { AddProductToWishlistUseCase, CreateWishlistUseCase, DeleteWishlistUseCase, GetClientWishlistDetailsUseCase, GetClientWishlistsUseCase, RemoveProductFromWishlistUseCase, UpdateWishlistUseCase } from "../../../application/use-cases/wishlist.use-case";
import { NextFunction, Request, Response } from "express";
import { AddProductToWishlistDTO, CreateWishlistDTO, GetWishlistDetailsDTO, UpdateWishlistDTO } from "../../../application/dtos/wishlist.dto";

@injectable()
export class WishlistController {
    constructor(
        @inject(GetClientWishlistsUseCase) private getClienWishlistsUseCase: GetClientWishlistsUseCase,
        @inject(GetClientWishlistDetailsUseCase) private getClientWishlistDetailsUseCase: GetClientWishlistDetailsUseCase,
        @inject(CreateWishlistUseCase) private createWishlistUseCase: CreateWishlistUseCase,
        @inject(DeleteWishlistUseCase) private deleteWishlistUseCase: DeleteWishlistUseCase,
        @inject(UpdateWishlistUseCase) private updateWishlistUseCase: UpdateWishlistUseCase,
        @inject(AddProductToWishlistUseCase) private addProductToWishlistUseCase: AddProductToWishlistUseCase,
        @inject(RemoveProductFromWishlistUseCase) private removeProductFromWishlistUseCase: RemoveProductFromWishlistUseCase,
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

    public deleteWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user.id;
            const dto: GetWishlistDetailsDTO = {
                clientId,
                wishlistId: Number(req.params.id)
            };
            const [status, data] = await this.deleteWishlistUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public updateWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user.id;
            const dto: UpdateWishlistDTO = {
                clientId,
                wishlistId: Number(req.params.id),
                name: req.body.name
            };
            const [status, data] = await this.updateWishlistUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public addProductToWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user.id;
            const dto: AddProductToWishlistDTO = {
                clientId,
                wishlistId: Number(req.params.id),
                productId: req.body.productId
            };
            const [status, data] = await this.addProductToWishlistUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public removeProductFromWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user.id;
            const dto: AddProductToWishlistDTO = {
                clientId,
                wishlistId: Number(req.params.id),
                productId: req.body.productId
            };
            const [status, data] = await this.removeProductFromWishlistUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}