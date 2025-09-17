import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IOrderRepository } from "../../domain/repositories/order.repository";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { IStripePaymentRepository } from "../../domain/repositories/stripe.payment.repository";
import { CreateOrderDTO, GetAllOrdersDTO, GetClientOrdersDTO, GetOrderByIdDTO, UpdateOrderStatusDTO } from "../dtos/order.dto";
import { Order } from "../../domain/entities/order";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { Pool } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../infraestructure/ioc/types";

@injectable()
export class CreateOrderUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IStripePaymentRepository) private stripePaymentRepository: IStripePaymentRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: CreateOrderDTO): Promise<[number, Order]> {
        // 1. Verify Payment
        const payment = await this.stripePaymentRepository.findPaymentByIntentId(dto.paymentId.toString()); // Assuming paymentId is intentId for now
        // Or find by actual payment record ID if different
        if (!payment) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment record not found.");
        }
        if (payment.status !== 'succeeded' && payment.status !== 'completed') { // Adjust based on your payment statuses
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "Payment not successfully completed.");
        }
        if (payment.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.FORBIDDEN, "Payment does not belong to this client.");
        }
        if (payment.orderId) {
            throw new HttpError(HttpStatusCode.CONFLICT, "An order has already been created for this payment.");
        }


        // 2. Get Cart Details
        const cart = await this.cartRepository.getCartDetails(dto.clientId, dto.cartId);
        if (!cart) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Cart not found.");
        }
        if (cart.items.length === 0) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "Cannot create order from an empty cart.");
        }
        if (cart.id !== payment.cartId) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "Payment record does not match the provided cart.");
        }

        const poolClient = await this.pool.connect();

        // 3. Create Order
        try {
            await poolClient.query('BEGIN');

            const newOrder = await this.orderRepository.createOrder({
                clientId: dto.clientId,
                cart: cart,
                paymentMethod: payment.paymentMethodDetails, // Use the database ID of the payment record
                shippingAddress: dto.shippingAddress,
                billingAddress: dto.billingAddress,
            }, poolClient);

            // 4. Update Payment with Order ID
            // This creates a circular dependency if payment needs orderId at its creation.
            // Better to link payment to order after order is created.
            // The payments table already has an order_id column.
            // await this.stripePaymentRepository.linkOrderToPayment(payment.id, newOrder.id); // Need to add this method to IPaymentRepository
            // For now, let's assume the schema update for payments.order_id will be handled by setting it directly if possible,
            // or the webhook handler will eventually update it.
            // A simpler approach: update the payment record with the order ID.
            // This requires a method in paymentRepository, e.g., `setOrderIdForPayment(paymentId: number, orderId: number)`
            // For now, we'll assume the createOrder in repository handles this or it's done by webhook.
            // The schema has payments.order_id UNIQUE, so a payment can only be linked to one order.

            // 5. Update Cart Status to 'completed'
            await this.cartRepository.updateCartStatus(cart.id, 'completed', poolClient);
            await this.cartRepository.updateCartPaymentIntent(cart.id, null); // Clear active PI from cart

            return [HttpStatusCode.CREATED, newOrder];
        } catch (error) {
            // Handle potential stock issues or other order creation errors
            if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to create order: ${error}`);
        }
    }
}

@injectable()
export class GetOrderByIdUseCase {
    constructor(@inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository) { }

    public async execute(dto: GetOrderByIdDTO): Promise<[number, Order | null]> {
        const order = await this.orderRepository.findOrderById(dto.orderId);
        if (!order) {
            return [HttpStatusCode.NOT_FOUND, null];
        }
        // Authorization: Ensure client owns the order or user is admin
        if (dto.clientId && order.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.FORBIDDEN, "Access denied to this order.");
        }
        return [HttpStatusCode.OK, order];
    }
}

@injectable()
export class GetClientOrdersUseCase {
    constructor(@inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository) { }

    public async execute(dto: GetClientOrdersDTO): Promise<[number, Order[]]> {
        const orders = await this.orderRepository.findOrdersByClientId(dto.clientId);
        return [HttpStatusCode.OK, orders];
    }
}

@injectable()
export class UpdateOrderStatusUseCase {
    // This use case might be restricted to admins
    constructor(
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: UpdateOrderStatusDTO): Promise<[number, Order | null]> {
        const poolClient = await this.pool.connect();

        // Add authorization logic here if needed (e.g., check if user is admin)
        const updatedOrder = await this.orderRepository.updateOrderStatus(dto.orderId, dto.status, poolClient);
        if (!updatedOrder) {
            return [HttpStatusCode.NOT_FOUND, null];
        }
        return [HttpStatusCode.OK, updatedOrder];
    }
}

@injectable()
export class GetAllOrdersUseCase {
    constructor(@inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository) { }

    public async execute(dto: GetAllOrdersDTO): Promise<[number, Order[]]> {
        const orders = await this.orderRepository.getAllOrders(dto);
        return [HttpStatusCode.OK, orders];
    }
}