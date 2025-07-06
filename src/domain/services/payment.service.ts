// Domain-specific interfaces for payment entities to avoid leaking Stripe types into the domain.

export interface PaymentCustomer {
    id: string;
    email: string | null;
    name: string | null;
}

export interface PaymentMethod {
    id: string;
    card?: {
        brand: string | null;
        last4: string | null;
        exp_month: number | null;
        exp_year: number | null;
    };
    // Add other payment method types if needed (e.g., bank account)
}

export interface PaymentIntent {
    id: string;
    status: string; // e.g., 'requires_payment_method', 'succeeded', 'requires_action'
    client_secret: string | null;
    amount: number;
    currency: string;
    customer: string | PaymentCustomer | null;
    charges?: {
        data: {
            id: string;
            receipt_url: string | null;
            created: number;
            payment_method_details: any;
        }[];
    };
    shipping: {
        address?: {
            line1: string;
            city: string;
            postal_code: string;
            country: string;
        } | null
    } | null;
    metadata: { [key: string]: any };
}

export interface SetupIntent {
    id: string;
    client_secret: string | null;
    status: string;
}

export interface PaymentEvent {
    id: string;
    type: string;
    data: {
        object: any; // The actual object from the event (e.g., a PaymentIntent)
    };
}


// --- Service method parameter interfaces ---

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
    returnUrl?: string;
    setupFutureUsage?: 'on_session' | 'off_session';
}

export interface ConfirmPaymentIntentParams {
    paymentMethodId?: string;
    returnUrl?: string;
}

export interface AttachPaymentMethodParams {
    customerId: string;
    paymentMethodId: string;
}

export interface ListPaymentMethodsParams {
    customerId: string;
    type?: 'card' | 'sofort' | 'sepa_debit'; // Generic types
}

export interface CreateSetupIntentParams {
    customerId: string;
    metadata?: Record<string, any>;
}


// --- Main Payment Service Interface ---

export interface IPaymentService {
    createCustomer(params: CreateCustomerParams): Promise<PaymentCustomer>;
    createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent>;
    confirmPaymentIntent(paymentIntentId: string, params?: ConfirmPaymentIntentParams): Promise<PaymentIntent>;
    retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;
    attachPaymentMethodToCustomer(params: AttachPaymentMethodParams): Promise<PaymentMethod>;
    listCustomerPaymentMethods(params: ListPaymentMethodsParams): Promise<PaymentMethod[]>;
    detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod>;
    createSetupIntent(params: CreateSetupIntentParams): Promise<SetupIntent>;
    constructWebhookEvent(payload: string | Buffer, signature: string | string[] | Buffer, secret: string): Promise<PaymentEvent>;
}
