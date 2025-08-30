export interface GetWishlistDetailsDTO {
    clientId: number;
    wishlistId: number;
}

export interface CreateWishlistDTO {
    clientId: number;
    name: string;
}

export interface UpdateWishlistDTO extends CreateWishlistDTO {
    wishlistId: number;
}