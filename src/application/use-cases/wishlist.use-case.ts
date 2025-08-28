import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { Wishlist } from "../../domain/entities/wishlist";
import { IWishlistRepository } from "../../domain/repositories/wishlist.repository";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { GetWishlistDetailsDTO } from "../dtos/wishlist.dto";

@injectable()
export class GetClientWishlistsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IWishlistRepository) private wishlistRepository: IWishlistRepository
    ) { }

    public async execute(clientId: number): Promise<[number, Wishlist[]]> {
        return [HttpStatusCode.OK, await this.wishlistRepository.findByClientId(clientId)];
    }
}

@injectable()
export class GetClientWishlistDetailsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IWishlistRepository) private wishlistRepository: IWishlistRepository
    ) { }

    public async execute(dto: GetWishlistDetailsDTO): Promise<[number, Wishlist | null]> {
        return [HttpStatusCode.OK, await this.wishlistRepository.getWishlistDetails(dto.clientId, dto.wishlistId)];
    }
}