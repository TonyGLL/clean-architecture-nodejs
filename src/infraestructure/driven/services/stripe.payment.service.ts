import Stripe from 'stripe';
import { config } from '../../../infraestructure/config/env';
import { injectable } from 'inversify';
import { HttpError } from '../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../domain/shared/http.status';
import { IStripeService } from '../../../domain/services/stripe.service';

@injectable()
export class StripePaymentService implements IStripeService {
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

    public async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>> {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe retrieve payment intent failed: ${error.message}`);
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
