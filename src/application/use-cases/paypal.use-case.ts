import { inject, injectable } from "inversify";
import { Pool } from "pg";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { IPaypalService } from "../../domain/services/paypal.service";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { INFRASTRUCTURE_TYPES } from "../../infraestructure/ioc/types";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { IOrderRepository, CreateOrderParams } from "../../domain/repositories/order.repository";
import { IPaypalPaymentRepository } from "../../domain/repositories/paypal.payment.repository";
import { CreatePaypalOrderDTO } from "../dtos/payment.dto";
import { Payment } from "../../domain/entities/payment";

@injectable()
export class CreatePaypalOrderUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaypalService) private paypalService: IPaypalService,
        @inject(DOMAIN_TYPES.IPaypalPaymentRepository) private paypalPaymentRepository: IPaypalPaymentRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: CreatePaypalOrderDTO): Promise<[number, { orderId: string }]> {
        const poolClient = await this.pool.connect();

        try {
            const client = await this.paypalPaymentRepository.findClientById(dto.clientId);
            if (!client) throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");

            const cart = await this.cartRepository.getCartDetails(dto.clientId);
            if (!cart) throw new HttpError(HttpStatusCode.NOT_FOUND, "Cart not found");
            if (cart.status !== 'active') throw new HttpError(HttpStatusCode.CONFLICT, "Cart is not active.");

            await poolClient.query('BEGIN');

            const paypalOrderPayload = {
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: cart.total.toString()
                    }
                }]
            };

            const paypalOrder = await this.paypalService.createOrder(paypalOrderPayload);

            const createOrderParams: CreateOrderParams = {
                clientId: dto.clientId,
                cart,
                paymentMethod: 'paypal',
                shippingAddress: "",
                billingAddress: ""
            }
            const order = await this.orderRepository.createOrder(createOrderParams, poolClient);

            const createPaymentParams: Omit<Payment, "id" | "createdAt" | "updatedAt"> = {
                cartId: cart.id,
                clientId: dto.clientId,
                amount: cart.total,
                currency: 'USD',
                status: paypalOrder.status,
                external_payment_id: paypalOrder.id,
                receiptUrl: null,
                paymentDate: null,
                orderId: order.id,
                provider: 'paypal'
            }
            await this.paypalPaymentRepository.createPaymentRecord(createPaymentParams, poolClient);

            await poolClient.query('COMMIT');

            return [HttpStatusCode.CREATED, { orderId: paypalOrder.id }];
        } catch (error: any) {
            await poolClient.query('ROLLBACK');
            if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to create paypal order: ${error.message}`);
        } finally {
            poolClient.release();
        }
    }
}

@injectable()
export class CapturePaypalOrderUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaypalService) private paypalService: IPaypalService,
        @inject(DOMAIN_TYPES.IPaypalPaymentRepository) private paypalPaymentRepository: IPaypalPaymentRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(paypalOrderId: string): Promise<[number, { status: string }]> {
        const poolClient = await this.pool.connect();
        try {
            await poolClient.query('BEGIN');

            const payment = await this.paypalPaymentRepository.findPaymentByPaypalOrderId(paypalOrderId);
            if (!payment) throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment not found");

            const capturedOrder = await this.paypalService.captureOrder(paypalOrderId);

            await this.paypalPaymentRepository.updatePaymentStatus(paypalOrderId, capturedOrder.status, poolClient);

            await poolClient.query('COMMIT');

            return [HttpStatusCode.OK, { status: capturedOrder.status }];
        } catch (error: any) {
            await poolClient.query('ROLLBACK');
            if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to capture paypal order: ${error.message}`);
        } finally {
            poolClient.release();
        }
    }
}
