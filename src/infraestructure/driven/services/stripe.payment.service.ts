import Stripe from 'stripe';
import { config } from '../../../infraestructure/config/env';
import { injectable } from 'inversify';
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';
import { IPaymentService } from '../../../domain/services/payment.service';

@injectable()
export class StripePaymentService implements IPaymentService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
            apiVersion: '2025-06-30.basil'
        });
    }

    public async createCustomer(params: Stripe.CustomerCreateParams): Promise<Stripe.Response<Stripe.Customer>> {
        try {
            return await this.stripe.customers.create(params);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe customer creation failed: ${error.message}`);
        }
    }

    public async createPaymentIntent(params: Stripe.PaymentIntentCreateParams): Promise<Stripe.Response<Stripe.PaymentIntent>> {
        try {
            return await this.stripe.paymentIntents.create(params);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe payment intent creation failed: ${error.message}`);
        }
    }

    public async confirmPaymentIntent(paymentIntentId: string, params?: Stripe.PaymentIntentConfirmParams): Promise<Stripe.Response<Stripe.PaymentIntent>> {
        try {
            return await this.stripe.paymentIntents.confirm(paymentIntentId);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe payment intent confirmation failed: ${error.message}`);
        }
    }

    public async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>> {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe retrieve payment intent failed: ${error.message}`);
        }
    }

    public async attachPaymentMethodToCustomer(id: string, params: Stripe.PaymentMethodAttachParams): Promise<Stripe.Response<Stripe.PaymentMethod>> {
        try {
            return this.stripe.paymentMethods.attach(id, { customer: params.customer });
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe attach payment method failed: ${error.message}`);
        }
    }

    public async listCustomerPaymentMethods(params: Stripe.PaymentMethodListParams): Promise<Stripe.ApiListPromise<Stripe.PaymentMethod>> {
        try {
            return await this.stripe.paymentMethods.list({ customer: params.customer, type: params.type || 'card' });
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe list payment methods failed: ${error.message}`);
        }
    }

    public async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.Response<Stripe.PaymentMethod>> {
        try {
            return await this.stripe.paymentMethods.detach(paymentMethodId);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe detach payment method failed: ${error.message}`);
        }
    }

    public async createSetupIntent(params: Stripe.SetupIntentCreateParams): Promise<Stripe.Response<Stripe.SetupIntent>> {
        try {
            return await this.stripe.setupIntents.create({ ...params, usage: 'off_session' });
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe setup intent creation failed: ${error.message}`);
        }
    }

    public constructWebhookEvent(payload: string | Buffer, sig: string | string[] | Buffer, secret: string): Stripe.Event {
        try {
            return this.stripe.webhooks.constructEvent(payload, sig, secret);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, `Webhook Error: ${error.message}`);
        }
    }
}
