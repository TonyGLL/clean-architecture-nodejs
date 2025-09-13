import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { AddProductToCartUseCase, ApplyCouponToCartUseCase, ClearCartUseCase, DeleteProductFromCartUseCase, GetCartUseCase, LinkAddressToCartUseCase, RemoveCouponFromCartUseCase } from "../../../application/use-cases/cart.use-case";
import { AddProductToCartDTO } from "../../../application/dtos/cart.dto";

@injectable()
export class CartController {
    constructor(
        @inject(GetCartUseCase) private getCartUseCase: GetCartUseCase,
        @inject(AddProductToCartUseCase) private addProductToCartUseCase: AddProductToCartUseCase,
        @inject(DeleteProductFromCartUseCase) private deleteProductFromCartUseCase: DeleteProductFromCartUseCase,
        @inject(ClearCartUseCase) private clearCartUseCase: ClearCartUseCase,
        @inject(LinkAddressToCartUseCase) private linkAddressToCartUseCase: LinkAddressToCartUseCase,
        @inject(ApplyCouponToCartUseCase) private applyCouponToCartUseCase: ApplyCouponToCartUseCase,
        @inject(RemoveCouponFromCartUseCase) private removeCouponFromCartUseCase: RemoveCouponFromCartUseCase
    ) { }

    public getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.user as { id: number };
            const [status, data] = await this.getCartUseCase.execute(id);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public addProductToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: clientId } = req.user as { id: number };
            const { id: productIdIn } = req.params as { id: string };
            const { quantity } = req.body as { quantity: number };
            const dto: AddProductToCartDTO = {
                clientId,
                productId: Number.parseInt(productIdIn),
                quantity
            };
            const [status, data] = await this.addProductToCartUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public deleteProductFromCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: clientId } = req.user as { id: number };
            const { id: productIdIn } = req.params as { id: string };
            const [status, data] = await this.deleteProductFromCartUseCase.deleteProductFromCart(clientId, parseInt(productIdIn));
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.user as { id: number };
            const [status, data] = await this.clearCartUseCase.execute(id);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public linkAddressToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: clientId } = req.user as { id: number };
            const { id: addressId } = req.params as { id: string };
            const [status, data] = await this.linkAddressToCartUseCase.execute(+addressId, clientId);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public applyCouponToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: clientId } = req.user as { id: number };
            const { code } = req.params as { code: string };
            const [status, data] = await this.applyCouponToCartUseCase.execute(clientId, code);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public removeCouponFromCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: clientId } = req.user as { id: number };
            const [status, data] = await this.removeCouponFromCartUseCase.execute(clientId);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}