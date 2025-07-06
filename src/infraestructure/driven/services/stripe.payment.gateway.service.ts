import Stripe from 'stripe';
import { config } from '../../../infraestructure/config/env'; // Adjusted path
import { injectable } from 'inversify';
import { HttpError } from '../../../domain/errors/http.error'; // Adjusted path
import { HttpStatusCode } from '../../../domain/shared/http.status'; // Adjusted path
import {
    AttachPaymentMethodParams,
    ConfirmPaymentIntentParams,
    CreateCustomerParams,
    CreatePaymentIntentParams,
    CreateSetupIntentParams,
    IPaymentGatewayService,
    ListPaymentMethodsParams
} from '../../../domain/services/payment.gateway.service'; // Adjusted path

@injectable()
export class StripePaymentGatewayService implements IPaymentGatewayService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
            apiVersion: '2024-04-10',
        });
    }

    async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
        try {
            const customer = await this.stripe.customers.create({
                email: params.email,
                name: params.name,
                metadata: params.metadata
            });
            return customer;
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe customer creation failed: ${error.message}`);
        }
    }

    async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
        try {
            const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
                amount: params.amount, // Already in cents as per interface expectation
                currency: params.currency,
                metadata: params.metadata,
                description: params.description,
                return_url: params.returnUrl,
                setup_future_usage: params.setupFutureUsage
            };
            if (params.customerId) {
                paymentIntentParams.customer = params.customerId;
            }
            if (params.paymentMethodId) {
                paymentIntentParams.payment_method = params.paymentMethodId;
            }
            if (params.confirm !== undefined) { // Check for undefined as confirm can be false
                paymentIntentParams.confirm = params.confirm;
            }

            const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);
            return paymentIntent;
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe payment intent creation failed: ${error.message}`);
        }
    }

    async confirmPaymentIntent(paymentIntentId: string, params?: ConfirmPaymentIntentParams): Promise<Stripe.PaymentIntent> {
        try {
            const confirmParams: Stripe.PaymentIntentConfirmParams = {};
            if (params?.paymentMethodId) {
                confirmParams.payment_method = params.paymentMethodId;
            }
            if (params?.returnUrl) {
                confirmParams.return_url = params.returnUrl;
            }

            const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, confirmParams);
            return paymentIntent;
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe payment intent confirmation failed: ${error.message}`);
        }
    }

    async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            return paymentIntent;
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe retrieve payment intent failed: ${error.message}`);
        }
    }

    async attachPaymentMethodToCustomer(params: AttachPaymentMethodParams): Promise<Stripe.PaymentMethod> {
        try {
            const paymentMethod = await this.stripe.paymentMethods.attach(params.paymentMethodId, {
                customer: params.customerId,
            });
            return paymentMethod;
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe attach payment method failed: ${error.message}`);
        }
    }

    async listCustomerPaymentMethods(params: ListPaymentMethodsParams): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: params.customerId,
                type: params.type || 'card', // Default to card if not specified
            });
            return paymentMethods;
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe list payment methods failed: ${error.message}`);
        }
    }

    async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
        try {
            // Ensure the payment method is not set as default invoice payment method for a customer before detaching
            // This might require fetching the customer and checking invoice_settings.default_payment_method
            // For simplicity, direct detach is shown here.
            const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
            return paymentMethod;
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe detach payment method failed: ${error.message}`);
        }
    }

    async createSetupIntent(params: CreateSetupIntentParams): Promise<Stripe.SetupIntent> {
        try {
            const setupIntent = await this.stripe.setupIntents.create({
                customer: params.customerId,
                payment_method_types: ['card'], // Or make this configurable via params
                usage: 'off_session',
                metadata: params.metadata
            });
            return setupIntent;
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Stripe setup intent creation failed: ${error.message}`);
        }
    }

    async constructWebhookEvent(payload: string | Buffer, sig: string | string[] | Buffer, secret: string): Promise<Stripe.Event> {
        try {
            return this.stripe.webhooks.constructEvent(payload, sig, secret);
        } catch (err: any) { // StripeError is more specific if available, but 'any' is fine
            throw new HttpError(HttpStatusCode.BAD_REQUEST, `Webhook Error: ${err.message}`);
        }
    }
}
