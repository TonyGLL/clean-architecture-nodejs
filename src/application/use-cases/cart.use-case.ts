import { inject, injectable } from "inversify";
import { logger } from "../../infraestructure/config/winston";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { Cart } from "../../domain/entities/cart";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { HttpError } from "../../domain/errors/http.error";
import { AddProductToCartDTO } from "../dtos/cart.dto";
import { IProductsRepository } from "../../domain/repositories/products.repository";
import { ICouponsRepository } from "../../domain/repositories/coupons.repository";

@injectable()
export class GetCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository
    ) { }

    public async execute(dto: number): Promise<[number, Cart]> {
        logger.info(`[GetCartUseCase] - Starting to get cart for client: ${dto}`);
        try {
            let cartDetails = await this.cartRepository.getCartDetails(dto);

            if (!cartDetails) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Cart not found');

            return [HttpStatusCode.OK, cartDetails];
        } catch (error) {
            logger.error(`[GetCartUseCase] - Error getting cart for client: ${dto}`, { error });
            throw error;
        }
    }
}

@injectable()
export class AddProductToCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IProductsRepository) private productsRepository: IProductsRepository
    ) { }

    public async execute(dto: AddProductToCartDTO): Promise<[number, object]> {
        logger.info(`[AddProductToCartUseCase] - Starting to add product ${dto.productId} to cart for client: ${dto.clientId}`);
        try {
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
        } catch (error) {
            logger.error(`[AddProductToCartUseCase] - Error adding product ${dto.productId} to cart for client: ${dto.clientId}`, { error });
            throw error;
        }
    }
}

@injectable()
export class DeleteProductFromCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository
    ) { }

    public async deleteProductFromCart(clientId: number, productId: number): Promise<[number, object]> {
        logger.info(`[DeleteProductFromCartUseCase] - Starting to delete product ${productId} from cart for client: ${clientId}`);
        try {
            await this.cartRepository.deleteProductFromCart(clientId, productId)
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            logger.error(`[DeleteProductFromCartUseCase] - Error deleting product ${productId} from cart for client: ${clientId}`, { error });
            throw error;
        }
    }
}

@injectable()
export class ClearCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository
    ) { }

    public async execute(clientId: number): Promise<[number, object]> {
        logger.info(`[ClearCartUseCase] - Starting to clear cart for client: ${clientId}`);
        try {
            await this.cartRepository.clearCart(clientId);
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            logger.error(`[ClearCartUseCase] - Error clearing cart for client: ${clientId}`, { error });
            throw error;
        }
    }
}

@injectable()
export class LinkAddressToCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository
    ) { }

    public async execute(addressId: number, clientId: number): Promise<[number, object]> {
        logger.info(`[LinkAddressToCartUseCase] - Starting to link address ${addressId} to cart for client: ${clientId}`);
        try {
            await this.cartRepository.linkAddressToCart(addressId, clientId);
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error) {
            logger.error(`[LinkAddressToCartUseCase] - Error linking address ${addressId} to cart for client: ${clientId}`, { error });
            throw error;
        }
    }
}

@injectable()
export class ApplyCouponToCartUseCase {
    constructor(
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.ICouponsRepository) private couponsRepository: ICouponsRepository
    ) { }

    public async execute(clientId: number, couponCode: string): Promise<[number, object]> {
        const coupon = await this.couponsRepository.getCouponByCode(couponCode);
        if (!coupon) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Coupon not found');
        if (coupon.valid_until < new Date()) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Coupon has expired');

        await this.cartRepository.applyCouponToCart(couponCode, clientId);

        return [HttpStatusCode.NO_CONTENT, { message: 'Coupon applied successfully' }];
    }
}