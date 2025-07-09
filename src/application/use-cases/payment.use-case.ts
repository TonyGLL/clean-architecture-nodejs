import { inject, injectable } from "inversify";
import { IPaymentRepository } from "../../domain/repositories/payment.repository";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { AddPaymentMethodDTO, ClientPaymentMethodsDTO, ConfirmPaymentDTO, CreatePaymentIntentDTO, DeletePaymentMethodDTO } from "../dtos/payment.dto";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { PaymentMethod } from "../../domain/entities/paymentMethod";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { IPaymentService } from "../../domain/services/payment.service";
import Stripe from "stripe";
import { INFRASTRUCTURE_TYPES } from "../../infraestructure/ioc/types";
import { Pool, PoolClient } from "pg";
import { Payment } from "../../domain/entities/payment";
import { CreateOrderParams, IOrderRepository } from "../../domain/repositories/order.repository";

@injectable()
export class AddPaymentMethodUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: AddPaymentMethodDTO): Promise<[number, PaymentMethod]> {
        const poolClient: PoolClient = await this.pool.connect();
        let client = await this.paymentRepository.findClientById(dto.clientId);
        if (!client) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");
        }

        if (!client.stripe_customer_id) {
            const customerParams: Stripe.CustomerCreateParams = {
                email: client.email,
                name: client.name,
                metadata: { client_id: client.id.toString() }
            };
            const customer = await this.paymentService.createCustomer(customerParams);
            await this.paymentRepository.updateClientStripeCustomerId(client.id, customer.id, poolClient);
            client.stripe_customer_id = customer.id;
        }

        try {
            const paymentMethodParams: Stripe.PaymentMethodAttachParams = {
                customer: client.stripe_customer_id
            };
            const domainPaymentMethod = await this.paymentService.attachPaymentMethodToCustomer(dto.stripePaymentMethodId, paymentMethodParams);

            const existingMethod = await this.paymentRepository.findPaymentMethodByStripeId(domainPaymentMethod.id);
            if (existingMethod) {
                if (existingMethod.clientId !== dto.clientId) {
                    throw new HttpError(HttpStatusCode.CONFLICT, "Payment Method is already associated with another client.");
                }
                if (dto.isDefault) {
                    await this.paymentRepository.setDefaultPaymentMethod(dto.clientId, existingMethod.id);
                    existingMethod.isDefault = true;
                }
                return [HttpStatusCode.OK, existingMethod];
            }

            const newPaymentMethod = await this.paymentRepository.addPaymentMethod(
                dto.clientId,
                domainPaymentMethod.id,
                domainPaymentMethod.card?.brand || null,
                domainPaymentMethod.card?.last4 || null,
                domainPaymentMethod.card?.exp_month || null,
                domainPaymentMethod.card?.exp_year || null,
                dto.isDefault || false
            );
            return [HttpStatusCode.CREATED, newPaymentMethod];
        } catch (error: any) {
            if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to add payment method: ${error.message}`);
        }
    }
}

@injectable()
export class GetClientPaymentMethodsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository
    ) { }

    public async execute(dto: ClientPaymentMethodsDTO): Promise<[number, PaymentMethod[]]> {
        const paymentMethods = await this.paymentRepository.getClientPaymentMethods(dto.clientId);
        return [HttpStatusCode.OK, paymentMethods];
    }
}

@injectable()
export class DeletePaymentMethodUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository
    ) { }

    public async execute(dto: DeletePaymentMethodDTO): Promise<[number, object]> {
        const paymentMethod = await this.paymentRepository.findPaymentMethodByStripeId(dto.paymentMethodId);
        if (!paymentMethod || paymentMethod.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment method not found or does not belong to the client.");
        }

        try {
            await this.paymentService.detachPaymentMethod(dto.paymentMethodId);
            await this.paymentRepository.deletePaymentMethod(paymentMethod.id);
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to delete payment method: ${error.message}`);
        }
    }
}

@injectable()
export class CreatePaymentIntentUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: CreatePaymentIntentDTO): Promise<[number, { clientSecret: string | null; paymentIntentId: string; requiresAction: boolean; status: string; }]> {
        const poolClient = await this.pool.connect();

        try {
            //* Validar si el cliente existe
            const client = await this.paymentRepository.findClientById(dto.clientId);
            if (!client) throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");

            //* Validar si el cliente tiene un carrito activo
            const cart = await this.cartRepository.getCartDetails(dto.clientId);
            if (!cart) throw new HttpError(HttpStatusCode.NOT_FOUND, "Cart not found");
            if (cart.status !== 'active') throw new HttpError(HttpStatusCode.CONFLICT, "Cart is not active. Cannot create payment intent.");

            await poolClient.query('BEGIN');

            let customerId = client.stripe_customer_id;
            //* Si el cliente no tiene un customer_id de Stripe, crearlo
            //* Esto es necesario para poder crear un PaymentIntent asociado a un cliente
            if (!customerId) {
                //* Crear un nuevo cliente en Stripe
                const createCustomerParams: Stripe.CustomerCreateParams = {
                    email: client.email,
                    name: client.name,
                    metadata: { client_id: client.id.toString() }
                };
                const { id } = await this.paymentService.createCustomer(createCustomerParams);

                //* Actualizar el cliente en la base de datos con el customer_id de Stripe
                await this.paymentRepository.updateClientStripeCustomerId(client.id, id, poolClient);
                customerId = id;
            }

            //* Si el cliente tiene un PaymentIntent activo, intentar recuperarlo
            let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;

            if (cart.activePaymentIntentId) {
                //* Obtener el intento de pago si es que el mismo existe
                const existingPayment = await this.paymentRepository.findPaymentByIntentId(cart.activePaymentIntentId || '');

                if (existingPayment?.stripePaymentIntentId && (existingPayment.status === 'pending' || existingPayment.status === 'requires_action')) {
                    paymentIntent = await this.paymentService.retrievePaymentIntent(existingPayment.stripePaymentIntentId);
                    if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(paymentIntent.status!)) {

                        await poolClient.query('COMMIT');

                        return [HttpStatusCode.OK, { clientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id!, requiresAction: paymentIntent.status === 'requires_action', status: paymentIntent.status! }];
                    } else if (paymentIntent.status === 'succeeded') {
                        throw new HttpError(HttpStatusCode.CONFLICT, "Payment for this cart has already succeeded.");
                    }
                }
            }

            //* Crear intento de pago en stripe
            const createPaymentIntentParams: Stripe.PaymentIntentCreateParams = {
                amount: Math.round(cart.total * 100),
                currency: dto.currency,
                customer: customerId,
                payment_method: dto.paymentMethodId,
                confirm: dto.confirm || false,
                metadata: { ...dto.metadata, cart_id: cart.id.toString(), client_id: dto.clientId.toString() },
                description: `Payment for cart ${cart.id}`
            };
            paymentIntent = await this.paymentService.createPaymentIntent(createPaymentIntentParams);

            //* Crear orden en dn en estado pending
            const createOrderParams: CreateOrderParams = {
                clientId: dto.clientId,
                cart,
                paymentMethod: dto.paymentMethodId!,
                shippingAddress: "",
                billingAddress: ""
            }
            const order = await this.orderRepository.createOrder(createOrderParams);

            //* Crear pago en db
            const createPaymentParams: Omit<Payment, "id" | "createdAt" | "updatedAt"> = {
                cartId: cart.id,
                clientId: dto.clientId,
                amount: cart.total,
                currency: dto.currency,
                status: paymentIntent.status!,
                stripePaymentIntentId: paymentIntent.id!,
                stripeChargeId: null,
                paymentMethodDetails: null, // Will be populated by webhook
                receiptUrl: null,
                paymentDate: null,
                orderId: order.id,
            }
            await this.paymentRepository.createPaymentRecord(createPaymentParams, poolClient);

            //await this.cartRepository.updateCartPaymentIntent(cart.id, paymentIntent.id);

            await poolClient.query('COMMIT');

            return [HttpStatusCode.CREATED, { clientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id!, requiresAction: paymentIntent.status === 'requires_action', status: paymentIntent.status! }];
        } catch (error: any) {
            await poolClient.query('ROLLBACK');
            if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to create payment intent: ${error.message}`);
        } finally {
            poolClient.release();
        }
    }
}

@injectable()
export class ConfirmPaymentUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository
    ) { }

    public async execute(dto: ConfirmPaymentDTO): Promise<[number, { paymentIntentId: string; status: string; requiresAction: boolean; clientSecret?: string | null; chargeId?: string; receiptUrl?: string }]> {
        const localPayment = await this.paymentRepository.findPaymentByIntentId(dto.paymentIntentId);
        if (!localPayment || localPayment.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment intent not found or does not belong to the client.");
        }

        if (localPayment.status === 'succeeded') {
            return [HttpStatusCode.OK, { paymentIntentId: localPayment.stripePaymentIntentId!, status: localPayment.status, requiresAction: false, chargeId: localPayment.stripeChargeId || undefined, receiptUrl: localPayment.receiptUrl || undefined }];
        }

        try {
            let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;
            if (localPayment.status === 'requires_confirmation' || (localPayment.status === 'requires_payment_method' && dto.paymentMethodId)) {
                paymentIntent = await this.paymentService.confirmPaymentIntent(dto.paymentIntentId, { payment_method: dto.paymentMethodId });
            } else {
                paymentIntent = await this.paymentService.retrievePaymentIntent(dto.paymentIntentId);
            }

            //const charge = paymentIntent.charges?.data[0];

            await this.paymentRepository.updatePaymentStatus(
                paymentIntent.id!,
                paymentIntent.status!,
                paymentIntent.id,
                paymentIntent.receipt_email!,
                paymentIntent.status === 'succeeded' ? new Date(paymentIntent.created! * 1000) : undefined,
                paymentIntent.payment_method_configuration_details?.id || null
            );

            return [HttpStatusCode.OK, {
                paymentIntentId: paymentIntent.id!,
                status: paymentIntent.status!,
                requiresAction: paymentIntent.status === 'requires_action',
                clientSecret: paymentIntent.client_secret,
                chargeId: paymentIntent.id,
                receiptUrl: paymentIntent.receipt_email!,
            }];
        } catch (error: any) {
            if (error instanceof HttpError) throw error;
            // A more specific error check for card errors might be needed depending on the payment service abstraction
            await this.paymentRepository.updatePaymentStatus(dto.paymentIntentId, 'failed');
            throw new HttpError(HttpStatusCode.BAD_REQUEST, `Failed to confirm payment: ${error.message}`);
        }
    }
}
