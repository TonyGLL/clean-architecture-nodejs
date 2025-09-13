import { CartItemDTO } from "../../application/dtos/product.dto";
import { Address } from "./address";
import { DiscountType } from "./coupon";
import { Product } from "./product";

export class Cart {
    constructor(
        public id: number,
        public clientId: number,
        public status: string = 'active',
        public createdAt: Date = new Date(),
        public items: Product[] = [],
        public address: Address | null,
        public wishlisted?: boolean,
        public subTotal: number = 0,
        public taxes: number = 0,
        public shipping: number = 40,
        public total: number = 0,
        public discount: number = 0,
        public activePaymentIntentId?: string | null,
        public coupon_id?: number | null
    ) { }

    public setActivePaymentIntenId(id: string): void {
        this.activePaymentIntentId = id;
    }

    public calculateSubTotal(items: CartItemDTO[]): void {
        this.subTotal = items.reduce((total: number, item: CartItemDTO) => total + (item.quantity * item.unit_price), 0);
    }

    public calculateTaxes(taxRate: number = 0.16): void {
        this.taxes = Number.parseFloat((this.subTotal * taxRate).toFixed(2));
    }

    public calculateTotal(): void {
        this.total = this.subTotal + this.taxes + this.shipping - this.discount;
    }

    public calculateDiscount(discount_value: number, discount_type: DiscountType): void {
        if (discount_type === 'percentage') {
            this.discount = this.subTotal * (discount_value / 100);
        } else {
            this.discount = discount_value;
        }
    }

    public setCoupon(coupon_id: number | null): void {
        this.coupon_id = coupon_id;
    }
}