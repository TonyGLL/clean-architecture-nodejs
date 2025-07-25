
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
export class AddPaymentMethodUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IStripeService) private stripeService: IStripeService,
        @inject(DOMAIN_TYPES.IStripePaymentRepository) private stripePaymentRepository: IStripePaymentRepository
    ) { }

    public async execute(dto: AddPaymentMethodDTO): Promise<[number, PaymentMethod]> {
        const client = await this.stripePaymentRepository.findClientById(dto.clientId);
        if (!client || !client.external_customer_id) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Stripe customer not found.");
        }

        try {
            // Attach the payment method to the customer in Stripe
            await this.stripeService.attachPaymentMethod(dto.stripePaymentMethodId, client.external_customer_id);

            // Retrieve payment method details to store locally
            const paymentMethodDetails = await this.stripeService.retrievePaymentMethod(dto.stripePaymentMethodId);
            if (!paymentMethodDetails.card) {
                throw new HttpError(HttpStatusCode.BAD_REQUEST, "Payment method is not a card.");
            }

            // Add payment method to the local database
            const newPaymentMethod = await this.stripePaymentRepository.addPaymentMethod(
                dto.clientId,
                dto.stripePaymentMethodId,
                paymentMethodDetails.card.brand,
                paymentMethodDetails.card.last4,
                paymentMethodDetails.card.exp_month,
                paymentMethodDetails.card.exp_year,
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
        if (!paymentMethod) throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment method not found or does not belong to the client.");

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
            // Validate if the client exists
            const client = await this.stripePaymentRepository.findClientById(dto.clientId);
            if (!client) throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");

            // Validate if the client has an active cart
            const cart = await this.cartRepository.getCartDetails(dto.clientId);
            if (!cart) throw new HttpError(HttpStatusCode.NOT_FOUND, "Cart not found");
            if (cart.status !== 'active') throw new HttpError(HttpStatusCode.CONFLICT, "Cart is not active. Cannot create payment intent.");

            await poolClient.query('BEGIN');

            let customerId = client.external_customer_id;
            // If the client does not have a Stripe customer_id, create one
            // This is necessary to be able to create a PaymentIntent associated with a client
            if (!customerId) {
                // Create a new customer in Stripe
                const createCustomerParams: Stripe.CustomerCreateParams = {
                    email: client.email,
                    name: client.name,
                    metadata: { client_id: client.id.toString() }
                };
                const { id } = await this.stripeService.createCustomer(createCustomerParams);

                // Update the client in the database with the Stripe customer_id
                await this.stripePaymentRepository.updateClientStripeCustomerId(client.id, id);
                customerId = id;
            }

            // If the client has an active PaymentIntent, try to retrieve it
            let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;

            if (cart.activePaymentIntentId) {
                // Get the payment intent if it exists
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

            // Create payment intent in Stripe
            const createPaymentIntentParams: Stripe.PaymentIntentCreateParams = {
                amount: Math.round(cart.total * 100),
                currency: dto.currency,
                customer: customerId,
                payment_method: dto.paymentMethodId,
                confirm: dto.confirm || false,
                metadata: { ...dto.metadata, cart_id: cart.id.toString(), client_id: dto.clientId.toString() },
                description: `Payment for cart ${cart.id}`,
                shipping: {
                    name: client.name,
                    address: {
                        line1: cart.address?.address_line1,
                        line2: cart.address?.address_line2,
                        city: cart.address?.city,
                        state: cart.address?.state,
                        postal_code: cart.address?.postal_code,
                        country: cart.address?.country
                    }
                },
            };
            paymentIntent = await this.stripeService.createPaymentIntent(createPaymentIntentParams);

            // Create order in db in pending status
            const createOrderParams: CreateOrderParams = {
                clientId: dto.clientId,
                cart,
                paymentMethod: dto.paymentMethodId!,
                shippingAddress: "",
                billingAddress: ""
            }
            const order = await this.orderRepository.createOrder(createOrderParams, poolClient);

            // Create payment in db
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
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(clientId: number): Promise<[number, object]> {
        const poolClient = await this.pool.connect();

        try {
            await poolClient.query('BEGIN');
            // Validate if the client exists
            const client = await this.stripePaymentRepository.findClientById(clientId);
            if (!client) throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");

            let customerId = client.external_customer_id;
            // If the client does not have a Stripe customer_id, create one
            // This is necessary to be able to create a PaymentIntent associated with a client
            if (!customerId) {
                // Create a new customer in Stripe
                const createCustomerParams: Stripe.CustomerCreateParams = {
                    email: client.email,
                    name: client.name,
                    metadata: { client_id: client.id.toString() }
                };
                const { id } = await this.stripeService.createCustomer(createCustomerParams);

                // Update the client in the database with the Stripe customer_id
                await this.stripePaymentRepository.updateClientStripeCustomerId(client.id, id);
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
