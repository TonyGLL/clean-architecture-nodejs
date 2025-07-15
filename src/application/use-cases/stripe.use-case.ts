import { inject, injectable } from "inversify";
import { IStripePaymentRepository } from "../../domain/repositories/stripe.payment.repository";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { AddPaymentMethodDTO, ClientPaymentMethodsDTO, CreatePaymentIntentDTO, DeletePaymentMethodDTO } from "../dtos/payment.dto";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { PaymentMethod } from "../../domain/entities/paymentMethod";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { IStripeService } from "../../domain/services/stripe.service";
import Stripe from "stripe";
import { INFRASTRUCTURE_TYPES } from "../../infraestructure/ioc/types";
import { Pool } from "pg";
import { Payment } from "../../domain/entities/payment";
import { CreateOrderParams, IOrderRepository } from "../../domain/repositories/order.repository";

@injectable()
export class GetClientPaymentMethodsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IStripePaymentRepository) private stripePaymentRepository: IStripePaymentRepository
    ) { }

    public async execute(dto: ClientPaymentMethodsDTO): Promise<[number, PaymentMethod[]]> {
        const paymentMethods = await this.stripePaymentRepository.getClientPaymentMethods(dto.clientId);
        return [HttpStatusCode.OK, paymentMethods];
    }
}

@injectable()
export class DeletePaymentMethodUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IStripeService) private stripeService: IStripeService,
        @inject(DOMAIN_TYPES.IStripePaymentRepository) private stripePaymentRepository: IStripePaymentRepository
    ) { }

    public async execute(dto: DeletePaymentMethodDTO): Promise<[number, object]> {
        const paymentMethod = await this.stripePaymentRepository.findPaymentMethodByStripeId(dto.paymentMethodId);
        if (!paymentMethod || paymentMethod.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment method not found or does not belong to the client.");
        }

        try {
            await this.stripeService.detachPaymentMethod(dto.paymentMethodId);
            await this.stripePaymentRepository.deletePaymentMethod(paymentMethod.id);
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to delete payment method: ${error.message}`);
        }
    }
}

@injectable()
export class CreatePaymentIntentUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IStripeService) private stripeService: IStripeService,
        @inject(DOMAIN_TYPES.IStripePaymentRepository) private stripePaymentRepository: IStripePaymentRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: CreatePaymentIntentDTO): Promise<[number, { ok: boolean, clientSecret: string | null; paymentIntentId: string; requiresAction: boolean; status: string; }]> {
        const poolClient = await this.pool.connect();

        try {
            //* Validar si el cliente existe
            const client = await this.stripePaymentRepository.findClientById(dto.clientId);
            if (!client) throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");

            //* Validar si el cliente tiene un carrito activo
            const cart = await this.cartRepository.getCartDetails(dto.clientId);
            if (!cart) throw new HttpError(HttpStatusCode.NOT_FOUND, "Cart not found");
            if (cart.status !== 'active') throw new HttpError(HttpStatusCode.CONFLICT, "Cart is not active. Cannot create payment intent.");

            await poolClient.query('BEGIN');

            let customerId = client.external_customer_id;
            //* Si el cliente no tiene un customer_id de Stripe, crearlo
            //* Esto es necesario para poder crear un PaymentIntent asociado a un cliente
            if (!customerId) {
                //* Crear un nuevo cliente en Stripe
                const createCustomerParams: Stripe.CustomerCreateParams = {
                    email: client.email,
                    name: client.name,
                    metadata: { client_id: client.id.toString() }
                };
                const { id } = await this.stripeService.createCustomer(createCustomerParams);

                //* Actualizar el cliente en la base de datos con el customer_id de Stripe
                await this.stripePaymentRepository.updateClientStripeCustomerId(client.id, id, poolClient);
                customerId = id;
            }

            //* Si el cliente tiene un PaymentIntent activo, intentar recuperarlo
            let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;

            if (cart.activePaymentIntentId) {
                //* Obtener el intento de pago si es que el mismo existe
                const existingPayment = await this.stripePaymentRepository.findPaymentByIntentId(cart.activePaymentIntentId || '');

                if (existingPayment?.stripePaymentIntentId && (existingPayment.status === 'pending' || existingPayment.status === 'requires_action')) {
                    paymentIntent = await this.stripeService.retrievePaymentIntent(existingPayment.stripePaymentIntentId);
                    if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(paymentIntent.status!)) {

                        await poolClient.query('COMMIT');

                        return [HttpStatusCode.OK, { ok: true, clientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id!, requiresAction: paymentIntent.status === 'requires_action', status: paymentIntent.status! }];
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
            paymentIntent = await this.stripeService.createPaymentIntent(createPaymentIntentParams);

            //* Crear orden en dn en estado pending
            const createOrderParams: CreateOrderParams = {
                clientId: dto.clientId,
                cart,
                paymentMethod: dto.paymentMethodId!,
                shippingAddress: "",
                billingAddress: ""
            }
            const order = await this.orderRepository.createOrder(createOrderParams, poolClient);

            //* Crear pago en db
            const createPaymentParams: Omit<Payment, "id" | "createdAt" | "updatedAt"> = {
                cartId: cart.id,
                clientId: dto.clientId,
                amount: cart.total,
                currency: dto.currency,
                status: paymentIntent.status!,
                stripePaymentIntentId: paymentIntent.id!,
                stripeChargeId: null,
                paymentMethodDetails: dto.paymentMethodId,
                receiptUrl: null,
                paymentDate: null,
                orderId: order.id
            }
            await this.stripePaymentRepository.createPaymentRecord(createPaymentParams, poolClient);

            await poolClient.query('COMMIT');

            return [HttpStatusCode.CREATED, { ok: true, clientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id!, requiresAction: paymentIntent.status === 'requires_action', status: paymentIntent.status! }];
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
export class CreateSetupIntentUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IStripeService) private stripeService: IStripeService,
        @inject(DOMAIN_TYPES.IStripePaymentRepository) private stripePaymentRepository: IStripePaymentRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(clientId: number): Promise<[number, object]> {
        const poolClient = await this.pool.connect();

        try {
            //* Validar si el cliente existe
            const client = await this.stripePaymentRepository.findClientById(clientId);
            if (!client) throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");

            //* Validar si el cliente tiene un carrito activo
            const cart = await this.cartRepository.getCartDetails(clientId);
            if (!cart) throw new HttpError(HttpStatusCode.NOT_FOUND, "Cart not found");
            if (cart.status !== 'active') throw new HttpError(HttpStatusCode.CONFLICT, "Cart is not active. Cannot create payment intent.");

            let customerId = client.external_customer_id;
            //* Si el cliente no tiene un customer_id de Stripe, crearlo
            //* Esto es necesario para poder crear un PaymentIntent asociado a un cliente
            if (!customerId) {
                //* Crear un nuevo cliente en Stripe
                const createCustomerParams: Stripe.CustomerCreateParams = {
                    email: client.email,
                    name: client.name,
                    metadata: { client_id: client.id.toString() }
                };
                const { id } = await this.stripeService.createCustomer(createCustomerParams);

                //* Actualizar el cliente en la base de datos con el customer_id de Stripe
                await this.stripePaymentRepository.updateClientStripeCustomerId(client.id, id, poolClient);
                customerId = id;
            }

            const createSetupIntentParams: Stripe.SetupIntentCreateParams = {
                customer: customerId,
                payment_method_types: ['card'],
                usage: 'off_session'
            };
            const setupIntent = await this.stripeService.createSetupIntent(createSetupIntentParams);

            await poolClient.query('COMMIT');

            return [HttpStatusCode.OK, { ok: true, clientSecret: setupIntent.client_secret }];
        } catch (error: any) {
            await poolClient.query('ROLLBACK');

            if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.BAD_REQUEST, `Failed to create setup intent: ${error.message}`);
        } finally {
            poolClient.release();
        }
    }
}