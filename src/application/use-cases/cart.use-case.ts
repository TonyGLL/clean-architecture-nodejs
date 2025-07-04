import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { Cart } from "../../domain/entities/cart";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { HttpError } from "../../domain/errors/http.error";
import { AddProductToCartDTO } from "../dtos/cart.dto";
import { IProductsRepository } from "../../domain/repositories/products.repository";

@injectable()
export class GetCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository
    ) { }

    public async execute(dto: number): Promise<[number, Cart]> {
        let cartDetails = await this.cartRepository.getCartDetails(dto);

        if (!cartDetails) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Cart not found');

        return [HttpStatusCode.OK, cartDetails];
    }
}

@injectable()
export class AddProductToCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(dto: AddProductToCartDTO): Promise<[number, object]> {
        const product = await this.productsRepository.getProductDetails(dto.productId.toString());
        if (!product) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Product not found');

        if (product.stock < dto.quantity) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Insufficient stock for the product');
        }

        await this.cartRepository.addProductToCart({
            clientId: dto.clientId,
            productId: dto.productId,
            quantity: dto.quantity,
            unitPrice: product.price
        });

        return [HttpStatusCode.NO_CONTENT, {}];
    }
}

@injectable()
export class DeleteProductFromCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository
    ) { }

    public async deleteProductFromCart(clientId: number, productId: number): Promise<[number, object]> {
        await this.cartRepository.deleteProductFromCart(clientId, productId)
        return [HttpStatusCode.NO_CONTENT, {}];
    }
}

@injectable()
export class ClearCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository
    ) { }

    public async execute(clientId: number): Promise<[number, object]> {
        await this.cartRepository.clearCart(clientId);
        return [HttpStatusCode.NO_CONTENT, {}];
    }
}