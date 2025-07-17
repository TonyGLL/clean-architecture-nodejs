export class PaymentMethod {
    constructor(
        public id: number,
        public clientId: number,
        public stripePaymentMethodId: string,
        public cardBrand: string | null,
        public cardLast4: string | null,
        public cardExpMonth: number | null,
        public cardExpYear: number | null,
        public isDefault: boolean,
        public createdAt: Date,
        public updatedAt: Date,
        public client_id: number
    ) { }
}
