import Stripe from 'stripe';
import { config } from '../../../infraestructure/config/env';
import { injectable } from 'inversify';
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';
import {
    IPaymentService,
    CreateCustomerParams, CreatePaymentIntentParams, ConfirmPaymentIntentParams,
    AttachPaymentMethodParams, ListPaymentMethodsParams, CreateSetupIntentParams,
    PaymentCustomer, PaymentIntent, PaymentMethod, SetupIntent, PaymentEvent
} from '../../../domain/services/payment.service';

@injectable()
export class StripePaymentService implements IPaymentService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
            apiVersion: '2025-06-30.basil'
        });
    }

    // --- Mappers --- //
    private toPaymentCustomer(customer: Stripe.Customer): PaymentCustomer {
        return { id: customer.id, email: customer.email, name: customer.name! };
    }

    private toPaymentMethod(pm: Stripe.PaymentMethod): PaymentMethod {
        return {
            id: pm.id,
            card: pm.card ? { ...pm.card } : undefined
        };
    }

    private toPaymentIntent(intent: Stripe.PaymentIntent): PaymentIntent {
        const paymentIntent: PaymentIntent = {
            id: intent.id,
            status: intent.status,
            client_secret: intent.client_secret,
            amount: intent.amount,
            currency: intent.currency,
            customer: null,
            shipping: null,
            metadata: intent.metadata
        }
        return paymentIntent;
    }

    private toSetupIntent(intent: Stripe.SetupIntent): SetupIntent {
        const setupIntent: SetupIntent = {
            id: intent.id,
            status: intent.status,
            client_secret: intent.client_secret
        };
        return setupIntent;
    }
    // No need to map PaymentIntent, SetupIntent, or Event as the domain interfaces match the structure.

    public async createCustomer(params: CreateCustomerParams): Promise<PaymentCustomer> {
        try {
            const customer = await this.stripe.customers.create(params);
            return this.toPaymentCustomer(customer);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe customer creation failed: ${error.message}`);
        }
    }

    public async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
        try {
            const response = await this.stripe.paymentIntents.create(params);
            return this.toPaymentIntent(response);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe payment intent creation failed: ${error.message}`);
        }
    }

    public async confirmPaymentIntent(paymentIntentId: string, params?: ConfirmPaymentIntentParams): Promise<PaymentIntent> {
        try {
            const response = await this.stripe.paymentIntents.confirm(paymentIntentId);
            return this.toPaymentIntent(response);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe payment intent confirmation failed: ${error.message}`);
        }
    }

    public async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        try {
            const response = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            return this.toPaymentIntent(response);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe retrieve payment intent failed: ${error.message}`);
        }
    }

    public async attachPaymentMethodToCustomer(params: AttachPaymentMethodParams): Promise<PaymentMethod> {
        try {
            const pm = await this.stripe.paymentMethods.attach(params.paymentMethodId, { customer: params.customerId });
            return this.toPaymentMethod(pm);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe attach payment method failed: ${error.message}`);
        }
    }

    public async listCustomerPaymentMethods(params: ListPaymentMethodsParams): Promise<PaymentMethod[]> {
        try {
            const pms = await this.stripe.paymentMethods.list({ customer: params.customerId, type: params.type || 'card' });
            return pms.data.map(this.toPaymentMethod);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe list payment methods failed: ${error.message}`);
        }
    }

    public async detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
        try {
            const pm = await this.stripe.paymentMethods.detach(paymentMethodId);
            return this.toPaymentMethod(pm);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe detach payment method failed: ${error.message}`);
        }
    }

    public async createSetupIntent(params: CreateSetupIntentParams): Promise<SetupIntent> {
        try {
            return await this.stripe.setupIntents.create({ ...params, usage: 'off_session' });
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe setup intent creation failed: ${error.message}`);
        }
    }

    public async constructWebhookEvent(payload: string | Buffer, sig: string | string[] | Buffer, secret: string): Promise<PaymentEvent> {
        try {
            return this.stripe.webhooks.constructEvent(payload, sig, secret);
        } catch (err: any) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, `Webhook Error: ${err.message}`);
        }
    }
}
