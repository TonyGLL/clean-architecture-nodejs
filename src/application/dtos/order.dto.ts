import { Cart } from "../../domain/entities/cart";

export interface CreateOrderDTO {
    clientId: number;
    cartId: number; // To fetch the cart server-side
    paymentId: number; // From the successful payment record
    shippingAddress: string; // Could be an ID of a saved address or a new address string/object
    billingAddress: string; // Similar to shippingAddress
}

export interface GetOrderByIdDTO {
    orderId: number;
    clientId?: number; // Optional: for authorization, ensure client owns the order
}

export interface GetClientOrdersDTO {
    clientId: number;
}

export interface UpdateOrderStatusDTO {
    orderId: number;
    status: string;
    // Potentially add adminUserId for authorization if only admins can update status
}
