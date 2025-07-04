import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { Cart } from "../../domain/entities/cart";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { HttpError } from "../../domain/errors/http.error";

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