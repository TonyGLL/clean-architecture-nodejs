export class Payment {
    constructor(
        public id: number,
        public orderId: number | null, // Nullable if payment is made before order creation (e.g. for cart)
        public cartId: number,
        public clientId: number,
        public amount: number, // Should be in main currency unit (e.g., dollars, pesos)
        public currency: string, // e.g., 'mxn', 'usd'
        public status: string, // e.g., 'pending', 'succeeded', 'failed'
        public stripePaymentIntentId: string | null,
        public stripeChargeId: string | null,
        public paymentMethodDetails: any | null, // e.g., card brand, last4 for non-saved methods
        public receiptUrl: string | null,
        public paymentDate: Date | null,
        public createdAt: Date,
        public updatedAt: Date,
        public payment_method?: string, // e.g., card brand, last4 for non-saved methods
        public order_id?: number, // e.g., card brand, last4 for non-saved methods
    ) { }
}
