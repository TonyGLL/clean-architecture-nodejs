export type DiscountType = 'percentage' | 'fixed_amount';
export class Coupon {
    private constructor(
        public id: string,
        public code: string,
        public discount_type: DiscountType,
        public discount_value: number,
        public min_order_amount: number,
        public max_discount: number,
        public usage_limit: number,
        public per_client_limit: number,
        public valid_from: Date,
        public valid_until: Date,
        public active: boolean,
        public created_at?: Date,
        public updated_at?: Date
    ) { }

    static create(
        id: string,
        code: string,
        discount_type: DiscountType,
        discount_value: number,
        min_order_amount: number,
        max_discount: number,
        usage_limit: number,
        per_client_limit: number,
        valid_from: Date,
        valid_until: Date,
        active: boolean,
        created_at?: Date,
        updated_at?: Date
    ): Coupon {
        return new Coupon(id, code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, per_client_limit, valid_from, valid_until, active, created_at, updated_at);
    }
}