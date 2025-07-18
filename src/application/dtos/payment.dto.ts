export interface AddPaymentMethodDTO {
    clientId: number;
    stripePaymentMethodId: string;
    isDefault?: boolean;
}

export interface CreatePaymentIntentDTO {
    clientId: number;
    currency: string;
    paymentMethodId?: string; // Optional: for paying with a specific saved method
    saveCard?: boolean; // Optional: if the user wants to save this new card
    confirm?: boolean; // Optional: to confirm the payment intent immediately
    metadata?: Record<string, any>;
}

export interface ClientPaymentMethodsDTO {
    clientId: number;
}

export interface DeletePaymentMethodDTO {
    clientId: number;
    paymentMethodId: string; // This is the Stripe PaymentMethod ID (pm_xxx)
}
