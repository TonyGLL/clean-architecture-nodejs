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
    object: 'payment_intent';
    amount: number;
    amount_capturable: number;
    amount_details: {
        tip: Record<string, unknown>;
    };
    amount_received: number;
    application: null;
    application_fee_amount: null;
    automatic_payment_methods: {
        allow_redirects: 'always';
        enabled: boolean;
    };
    canceled_at: null;
    cancellation_reason: null;
    capture_method: 'automatic_async';
    client_secret: string;
    confirmation_method: 'automatic';
    created: number;
    currency: string;
    customer: string;
    description: string;
    last_payment_error: null;
    latest_charge: null;
    livemode: boolean;
    metadata: {
        cart_id: string;
        client_id: string;
    };
    next_action: null;
    on_behalf_of: null;
    payment_method: null;
    payment_method_configuration_details: {
        id: string;
        parent: null;
    };
    payment_method_options: {
        card: {
            installments: unknown;
            mandate_options: null;
            network: null;
            request_three_d_secure: 'automatic';
        };
        link: {
            persistent_token: null;
        };
    };
    payment_method_types: ['card', 'link'];
    processing: null;
    receipt_email: null;
    review: null;
    setup_future_usage: null;
    shipping: null;
    source: null;
    statement_descriptor: null;
    statement_descriptor_suffix: null;
    status: string;
    transfer_data: null;
    transfer_group: null;
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
    customer?: string;
    payment_method?: string;
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
    createPaymentIntent(params: CreatePaymentIntentParams): Promise<Partial<PaymentIntent>>;
    confirmPaymentIntent(paymentIntentId: string, params?: ConfirmPaymentIntentParams): Promise<Partial<PaymentIntent>>;
    retrievePaymentIntent(paymentIntentId: string): Promise<Partial<PaymentIntent>>;
    attachPaymentMethodToCustomer(params: AttachPaymentMethodParams): Promise<PaymentMethod>;
    listCustomerPaymentMethods(params: ListPaymentMethodsParams): Promise<PaymentMethod[]>;
    detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod>;
    createSetupIntent(params: CreateSetupIntentParams): Promise<SetupIntent>;
    constructWebhookEvent(payload: string | Buffer, signature: string | string[] | Buffer, secret: string): Promise<PaymentEvent>;
}
