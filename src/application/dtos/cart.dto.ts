export interface AddProductToCartDTO {
    clientId: number;
    productId: number;
    quantity: number;
}

export interface AddProductToCartDTOPayload extends AddProductToCartDTO {
    unitPrice: number;
}