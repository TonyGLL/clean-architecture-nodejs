export interface GetWishlistDetailsDTO {
    clientId: number;
    wishlistId: number;
}

export interface CreateWishlistDTO {
    clientId: number;
    name: string;
}