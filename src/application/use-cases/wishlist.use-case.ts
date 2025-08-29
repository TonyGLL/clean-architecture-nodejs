import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { Wishlist } from "../../domain/entities/wishlist";
import { IWishlistRepository } from "../../domain/repositories/wishlist.repository";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { CreateWishlistDTO, GetWishlistDetailsDTO } from "../dtos/wishlist.dto";
import { HttpError } from "../../domain/errors/http.error";

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

@injectable()
export class CreateWishlistUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IWishlistRepository) private wishlistRepository: IWishlistRepository
    ) { }

    public async execute(dto: CreateWishlistDTO): Promise<[number, object]> {
        const existingWishlist = await this.wishlistRepository.findByName(dto.clientId, dto.name);
        if (existingWishlist) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Wishlist with this name already exists');

        await this.wishlistRepository.createWishlist(dto.clientId, dto.name);

        return [HttpStatusCode.OK, { message: 'Wishlist created successfully' }];
    }
}

@injectable()
export class DeleteWishlistUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IWishlistRepository) private wishlistRepository: IWishlistRepository
    ) { }

    public async execute(dto: GetWishlistDetailsDTO): Promise<[number, object]> {
        await this.wishlistRepository.deleteWishlist(dto.clientId, dto.wishlistId);

        return [HttpStatusCode.OK, { message: 'Wishlist deleted successfully' }];
    }
}