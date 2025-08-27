import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { Wishlist } from "../../domain/entities/wishlist";
import { IWishlistRepository } from "../../domain/repositories/wishlist.repository";
import { HttpStatusCode } from "../../domain/shared/http.status";

@injectable()
export class GetClientWishlistUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IWishlistRepository) private wishlistRepository: IWishlistRepository
    ) { }

    public async execute(clientId: number): Promise<[number, Wishlist[]]> {
        return [HttpStatusCode.OK, await this.wishlistRepository.findByClientId(clientId)];
    }
}