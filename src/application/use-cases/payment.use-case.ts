import { inject, injectable } from "inversify";
import { IPaymentRepository } from "../../domain/repositories/payment.repository";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { AddPaymentMethodDTO, ClientPaymentMethodsDTO, ConfirmPaymentDTO, CreatePaymentIntentDTO, DeletePaymentMethodDTO } from "../dtos/payment.dto";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { PaymentMethod } from "../../domain/entities/paymentMethod";
import Stripe from "stripe";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { Payment } from "../../domain/entities/payment";

@injectable()
export class AddPaymentMethodUseCase {
    constructor(
        private stripeService: StripeService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository
    ) { }

    public async execute(dto: AddPaymentMethodDTO): Promise<[number, PaymentMethod]> {
        let client = await this.paymentRepository.findClientById(dto.clientId);
        if (!client) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");
        }

        if (!client.stripe_customer_id) {
            const stripeCustomer = await this.stripeService.createCustomer(client.email, client.name);
            await this.paymentRepository.updateClientStripeCustomerId(client.id, stripeCustomer.id);
            client.stripe_customer_id = stripeCustomer.id;
        }

        try {
            const stripePaymentMethod = await this.stripeService.attachPaymentMethodToCustomer(client.stripe_customer_id, dto.stripePaymentMethodId);

            const existingMethod = await this.paymentRepository.findPaymentMethodByStripeId(stripePaymentMethod.id);
            if (existingMethod) {
                // Potentially update it or just return it if it's already linked to this client
                 if (existingMethod.clientId !== dto.clientId) {
                    // This case should ideally not happen if Stripe PM is correctly attached.
                    throw new HttpError(HttpStatusCode.CONFLICT, "Stripe Payment Method is already associated with another client.");
                }
                 // If it exists and belongs to this client, maybe just ensure its default status is updated.
                 if (dto.isDefault) {
                    await this.paymentRepository.setDefaultPaymentMethod(dto.clientId, existingMethod.id);
                    existingMethod.isDefault = true;
                 }
                return [HttpStatusCode.OK, existingMethod];
            }

            const newPaymentMethod = await this.paymentRepository.addPaymentMethod(
                dto.clientId,
                stripePaymentMethod.id,
                stripePaymentMethod.card?.brand || null,
                stripePaymentMethod.card?.last4 || null,
                stripePaymentMethod.card?.exp_month || null,
                stripePaymentMethod.card?.exp_year || null,
                dto.isDefault || false
            );
            return [HttpStatusCode.CREATED, newPaymentMethod];
        } catch (error: any) {
            if (error instanceof HttpError) throw error;
            // Check for Stripe specific errors if needed
            if (error.type === 'StripeCardError') {
                 throw new HttpError(HttpStatusCode.BAD_REQUEST, `Stripe error: ${error.message}`);
            }
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
        private stripeService: StripeService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository
    ) { }

    public async execute(dto: DeletePaymentMethodDTO): Promise<[number, object]> {
        const paymentMethod = await this.paymentRepository.findPaymentMethodByStripeId(dto.paymentMethodId);
        if (!paymentMethod || paymentMethod.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment method not found or does not belong to the client.");
        }

        try {
            // Detach from Stripe customer first. If successful, then remove from local DB.
            await this.stripeService.detachPaymentMethod(dto.paymentMethodId);
            await this.paymentRepository.deletePaymentMethod(paymentMethod.id);
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error: any) {
            // Handle Stripe errors (e.g., if already detached) or other issues
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to delete payment method: ${error.message}`);
        }
    }
}

@injectable()
export class CreatePaymentIntentUseCase {
    constructor(
        private stripeService: StripeService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository // To get cart details
    ) { }

    public async execute(dto: CreatePaymentIntentDTO): Promise<[number, { clientSecret: string | null; paymentIntentId: string; requiresAction: boolean; status: string; }]> {
        const client = await this.paymentRepository.findClientById(dto.clientId);
        if (!client) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");
        }

        const cart = await this.cartRepository.getCartDetails(dto.clientId, dto.cartId);
        if (!cart) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Cart not found");
        }
        if (cart.total !== dto.amount) {
            // This is a server-side check for amount consistency.
            // The DTO amount should ideally be derived from server-side cart calculation, not passed by client if possible.
            // Or, if client passes amount, ensure it matches server's calculation.
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "Cart total does not match the payment amount.");
        }

        let stripeCustomerId = client.stripe_customer_id;
        if (!stripeCustomerId) {
            const stripeCustomer = await this.stripeService.createCustomer(client.email, client.name);
            await this.paymentRepository.updateClientStripeCustomerId(client.id, stripeCustomer.id);
            stripeCustomerId = stripeCustomer.id;
        }

        const metadata = { ...dto.metadata, cart_id: dto.cartId.toString(), client_id: dto.clientId.toString() };
        let stripePaymentIntent: Stripe.PaymentIntent;

        try {
             // First, check if a payment record for this cart already exists and is in a pending state.
            let existingPayment = await this.paymentRepository.findPaymentByIntentId(cart.activePaymentIntentId || ''); // Assuming cart might store an active PI
            // Or query by cartId if that makes more sense for your logic:
            // let existingPayment = await this.paymentRepository.findPaymentByCartIdAndStatus(dto.cartId, 'pending');

            if (existingPayment && existingPayment.stripePaymentIntentId && (existingPayment.status === 'pending' || existingPayment.status === 'requires_action')) {
                // Retrieve the existing PaymentIntent from Stripe to check its status
                stripePaymentIntent = await this.stripeService.retrievePaymentIntent(existingPayment.stripePaymentIntentId);
                if (stripePaymentIntent.status === 'requires_payment_method' || stripePaymentIntent.status === 'requires_confirmation' || stripePaymentIntent.status === 'requires_action') {
                    // If PI is still processable, return its client_secret
                     return [HttpStatusCode.OK, {
                        clientSecret: stripePaymentIntent.client_secret,
                        paymentIntentId: stripePaymentIntent.id,
                        requiresAction: stripePaymentIntent.status === 'requires_action',
                        status: stripePaymentIntent.status
                    }];
                } else if (stripePaymentIntent.status === 'succeeded') {
                     throw new HttpError(HttpStatusCode.CONFLICT, "Payment for this cart has already succeeded.");
                }
                // If PI is in a state like 'canceled', a new one should be created.
            }


            stripePaymentIntent = await this.stripeService.createPaymentIntent(
                dto.amount,
                dto.currency,
                stripeCustomerId,
                dto.paymentMethodId, // if provided, Stripe will attempt to use it
                dto.confirm, // if true and PM provided, Stripe will attempt to confirm
                metadata
            );

            // Save the initial payment intent record to your database
            await this.paymentRepository.createPaymentRecord({
                cartId: dto.cartId,
                clientId: dto.clientId,
                amount: dto.amount, // Store in main currency unit
                currency: dto.currency,
                status: stripePaymentIntent.status, // Initial status from Stripe
                stripePaymentIntentId: stripePaymentIntent.id,
                stripeChargeId: null, // Will be populated later if payment succeeds directly or via webhook
                paymentMethodDetails: stripePaymentIntent.payment_method ? {
                    type: stripePaymentIntent.payment_method_types[0], // or more details from stripePaymentIntent.payment_method object if populated
                } : null,
                receiptUrl: null,
                paymentDate: null,
                orderId: null, // Order not created yet
            });

            // Store stripePaymentIntent.id on the cart if needed for future reference
            await this.cartRepository.updateCartPaymentIntent(dto.cartId, stripePaymentIntent.id);


            return [HttpStatusCode.CREATED, {
                clientSecret: stripePaymentIntent.client_secret,
                paymentIntentId: stripePaymentIntent.id,
                requiresAction: stripePaymentIntent.status === 'requires_action',
                status: stripePaymentIntent.status
            }];
        } catch (error: any) {
             if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to create payment intent: ${error.message}`);
        }
    }
}

@injectable()
export class ConfirmPaymentUseCase {
    constructor(
        private stripeService: StripeService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository // To update local payment record
    ) { }

    public async execute(dto: ConfirmPaymentDTO): Promise<[number, { paymentIntentId: string; status: string; requiresAction: boolean; clientSecret?: string | null; chargeId?: string; receiptUrl?: string }]> {
        const localPayment = await this.paymentRepository.findPaymentByIntentId(dto.paymentIntentId);
        if (!localPayment || localPayment.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment intent not found or does not belong to the client.");
        }

        if (localPayment.status === 'succeeded') {
            return [HttpStatusCode.OK, {
                paymentIntentId: localPayment.stripePaymentIntentId!,
                status: localPayment.status,
                requiresAction: false,
                chargeId: localPayment.stripeChargeId || undefined,
                receiptUrl: localPayment.receiptUrl || undefined
            }];
        }

        try {
            let stripePaymentIntent: Stripe.PaymentIntent;
            if(localPayment.status === 'requires_confirmation' || (localPayment.status === 'requires_payment_method' && dto.paymentMethodId)) {
                 stripePaymentIntent = await this.stripeService.confirmPaymentIntent(dto.paymentIntentId, dto.paymentMethodId);
            } else {
                // Just retrieve to check status, maybe it was confirmed by webhook
                stripePaymentIntent = await this.stripeService.retrievePaymentIntent(dto.paymentIntentId);
            }


            const charge = stripePaymentIntent.charges?.data[0];

            // Update local payment record
            await this.paymentRepository.updatePaymentStatus(
                stripePaymentIntent.id,
                stripePaymentIntent.status,
                charge?.id,
                charge?.receipt_url,
                stripePaymentIntent.status === 'succeeded' ? new Date() : undefined,
                charge?.payment_method_details ? charge.payment_method_details : undefined
            );

            // If succeeded, potentially trigger order creation, cart clearing etc. (handled by webhook or next step)

            return [HttpStatusCode.OK, {
                paymentIntentId: stripePaymentIntent.id,
                status: stripePaymentIntent.status,
                requiresAction: stripePaymentIntent.status === 'requires_action', // e.g. 3DS
                clientSecret: stripePaymentIntent.client_secret, // if further action is needed
                chargeId: charge?.id,
                receiptUrl: charge?.receipt_url
            }];
        } catch (error: any) {
            if (error.type === 'StripeCardError') {
                 await this.paymentRepository.updatePaymentStatus(dto.paymentIntentId, 'failed'); // Update local status
                 throw new HttpError(HttpStatusCode.BAD_REQUEST, `Stripe card error: ${error.message}`);
            }
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to confirm payment: ${error.message}`);
        }
    }
}
