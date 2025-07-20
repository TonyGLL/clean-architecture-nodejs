import { CreateOrderPayload, Order } from "@paypal/checkout-server-sdk/lib/orders/lib";

export interface IPaypalService {
    createOrder(payload: CreateOrderPayload): Promise<Order>;
    captureOrder(orderId: string): Promise<Order>;
    getOrder(orderId: string): Promise<Order>;
}
