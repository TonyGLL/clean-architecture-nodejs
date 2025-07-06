import Stripe from 'stripe';

export interface CreateCustomerParams {
    email: string;
    name: string;
    metadata?: Record<string, any>;
}

export interface CreatePaymentIntentParams {
    amount: number; // Smallest currency unit (e.g., cents)
    currency: string;
    customerId?: string;
    paymentMethodId?: string;
    confirm?: boolean;
    metadata?: Record<string, any>;
    description?: string;
    returnUrl?: string; // For payment methods requiring redirection
    setupFutureUsage?: 'on_session' | 'off_session';
}

export interface ConfirmPaymentIntentParams {
    paymentMethodId?: string;
    returnUrl?: string; // If needed for SCA
}

export interface AttachPaymentMethodParams {
    customerId: string;
    paymentMethodId: string;
}

export interface ListPaymentMethodsParams {
    customerId: string;
    type?: Stripe.PaymentMethodListParams.Type; // Example of Stripe-specific type leaking, could be made generic
}

export interface CreateSetupIntentParams {
    customerId: string;
    metadata?: Record<string, any>;
}

export interface IPaymentService {
    createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer>; // Return type could be a generic Customer object
    createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent>; // Return generic PaymentIntent
    confirmPaymentIntent(paymentIntentId: string, params?: ConfirmPaymentIntentParams): Promise<Stripe.PaymentIntent>;
    retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    attachPaymentMethodToCustomer(params: AttachPaymentMethodParams): Promise<Stripe.PaymentMethod>; // Return generic PaymentMethod
    listCustomerPaymentMethods(params: ListPaymentMethodsParams): Promise<Stripe.ApiList<Stripe.PaymentMethod>>; // Return list of generic PaymentMethod
    detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod>;
    createSetupIntent(params: CreateSetupIntentParams): Promise<Stripe.SetupIntent>; // Return generic SetupIntent
    constructWebhookEvent(payload: string | Buffer, signature: string | string[] | Buffer, secret: string): Promise<Stripe.Event>; // Return generic Event
}
