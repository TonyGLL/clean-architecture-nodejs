import { Order, OrderItem } from "../entities/order";
import { Cart } from "../entities/cart";

export interface CreateOrderParams {
    clientId: number;
    cart: Cart; // Pass the whole cart to extract items and total
    paymentId: number; // ID of the successful payment record
    shippingAddress: string; // Or a structured address object
    billingAddress: string; // Or a structured address object
}

export interface IOrderRepository {
    createOrder(params: CreateOrderParams): Promise<Order>;
    findOrderById(orderId: number): Promise<Order | null>;
    findOrdersByClientId(clientId: number): Promise<Order[]>;
    updateOrderStatus(orderId: number, status: string): Promise<Order | null>;
    // Potentially add methods to add/update order items if orders can be modified,
    // but typically orders are immutable once placed.
}
