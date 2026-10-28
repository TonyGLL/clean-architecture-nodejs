import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IOrderRepository } from "../../domain/repositories/order.repository";
import { GetAllOrdersDTO, GetAllOrdersResponseDTO, GetClientOrdersDTO, GetOrderByIdDTO, UpdateOrderStatusDTO } from "../dtos/order.dto";
import { Order } from "../../domain/entities/order";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { Pool } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../infraestructure/ioc/types";
import { IStripeService } from "../../domain/services/stripe.service";
import { logger } from "../../infraestructure/config/winston";

@injectable()
export class GetOrderByIdUseCase {
    constructor(@inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository) { }

    /** With `clientId` only the owner can read the order (others get 404, not 403, so ids cannot be probed); admins omit it. */
    public async execute(dto: GetOrderByIdDTO): Promise<[number, Order]> {
        const order = await this.orderRepository.findOrderById(dto.orderId);
        if (!order || (dto.clientId !== undefined && order.clientId !== dto.clientId)) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Order not found.");
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

/**
 * Fulfilment workflow an admin can drive. Orders enter `pending` (stock reserved, awaiting payment),
 * become `succeeded` when Stripe confirms the payment, and then move forward one step at a time.
 * `pending` orders are cancelled only by the reservation expiry job, never by hand.
 */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
    succeeded: ['processing'],
    processing: ['shipped'],
    shipped: ['delivered'],
};

@injectable()
export class UpdateOrderStatusUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: UpdateOrderStatusDTO): Promise<[number, Order]> {
        const order = await this.orderRepository.findOrderById(dto.orderId);
        if (!order) throw new HttpError(HttpStatusCode.NOT_FOUND, "Order not found.");

        if (!(ORDER_STATUS_TRANSITIONS[order.status] ?? []).includes(dto.status)) {
            throw new HttpError(HttpStatusCode.CONFLICT, `Cannot change order status from '${order.status}' to '${dto.status}'.`);
        }

        const poolClient = await this.pool.connect();
        try {
            const updatedOrder = await this.orderRepository.updateOrderStatus(dto.orderId, dto.status, poolClient);
            if (!updatedOrder) throw new HttpError(HttpStatusCode.NOT_FOUND, "Order not found.");
            return [HttpStatusCode.OK, updatedOrder];
        } finally {
            poolClient.release();
        }
    }
}

export interface ExpirePendingOrdersResult {
    cancelled: number;
    skipped: number;
    failed: number;
}

/**
 * Releases the stock held by orders whose payment never completed within the reservation window.
 * The Stripe PaymentIntent is cancelled first so a late payment cannot succeed for an order that no longer holds stock.
 */
@injectable()
export class ExpirePendingOrdersUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(DOMAIN_TYPES.IStripeService) private stripeService: IStripeService,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(reservationMinutes: number, batchSize = 50): Promise<ExpirePendingOrdersResult> {
        const result: ExpirePendingOrdersResult = { cancelled: 0, skipped: 0, failed: 0 };
        const expired = await this.orderRepository.findExpiredPendingOrders(reservationMinutes, batchSize);

        for (const { orderId, paymentIntentId } of expired) {
            try {
                if (paymentIntentId) {
                    const intent = await this.stripeService.retrievePaymentIntent(paymentIntentId);
                    // Money is moving: leave the order to the webhook
                    if (intent.status === 'succeeded' || intent.status === 'processing') {
                        result.skipped++;
                        continue;
                    }
                    if (intent.status !== 'canceled') await this.stripeService.cancelPaymentIntent(paymentIntentId);
                }

                const poolClient = await this.pool.connect();
                try {
                    await poolClient.query('BEGIN');
                    const cancelled = await this.orderRepository.cancelPendingOrder(orderId, poolClient);
                    await poolClient.query('COMMIT');
                    if (cancelled) {
                        result.cancelled++;
                        logger.info(`Order ${orderId} expired: stock released`);
                    } else {
                        result.skipped++;
                    }
                } catch (error) {
                    await poolClient.query('ROLLBACK');
                    throw error;
                } finally {
                    poolClient.release();
                }
            } catch (error) {
                result.failed++;
                logger.error(`Failed to expire order ${orderId}`, { error });
            }
        }
        return result;
    }
}

@injectable()
export class GetAllOrdersUseCase {
    constructor(@inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository) { }

    public async execute(dto: GetAllOrdersDTO): Promise<[number, GetAllOrdersResponseDTO]> {
        const response = await this.orderRepository.getAllOrders(dto);
        return [HttpStatusCode.OK, response];
    }
}