import { Product } from "./product"; // Assuming Product entity is defined

export class OrderItem {
    constructor(
        public id: number,
        public orderId: number,
        public productId: number,
        public quantity: number,
        public unitPrice: number, // Price at the time of purchase
        public subtotal: number,
        public product?: Product // Optional: for displaying product details
    ) {}
}

export class Order {
    constructor(
        public id: number,
        public clientId: number,
        public orderNumber: string, // Could be generated or from an external system
        public totalAmount: number,
        public status: string, // e.g., 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
        public shippingAddress: string, // Can be a JSON object or stringified
        public billingAddress: string, // Can be a JSON object or stringified
        public paymentId: number | null, // Link to the payment record
        public createdAt: Date,
        public updatedAt: Date,
        public items: OrderItem[] = []
    ) {}
}
