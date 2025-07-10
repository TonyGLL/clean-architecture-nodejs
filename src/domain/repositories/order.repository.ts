import { Order } from "../entities/order";
import { Cart } from "../entities/cart";
import { PoolClient } from "pg";

export interface CreateOrderParams {
    clientId: number;
    cart: Cart; // Pass the whole cart to extract items and total
    paymentMethod: string; // ID of the successful payment record
    shippingAddress: string; // Or a structured address object
    billingAddress: string; // Or a structured address object
}

export interface IOrderRepository {
    createOrder(params: CreateOrderParams, poolClient: PoolClient): Promise<Order>;
    findOrderById(orderId: number): Promise<Order | null>;
    findOrdersByClientId(clientId: number): Promise<Order[]>;
    updateOrderStatus(orderId: number, status: string, poolClient: PoolClient): Promise<Order | null>;
    // Potentially add methods to add/update order items if orders can be modified,
    // but typically orders are immutable once placed.
}
