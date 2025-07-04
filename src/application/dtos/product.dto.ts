import { Product } from "../../domain/entities/product";

export interface CartItemDTO extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
    quantity: number;
    unit_price: number;
}