import { PoolClient } from "pg";
import { Payment } from "../entities/payment";
import { PaymentMethod } from "../entities/paymentMethod";

export interface IStripePaymentRepository {
    // Client related
    findClientById(clientId: number): Promise<{ id: number; external_customer_id: string | null; email: string; name: string; } | null>;
    updateClientStripeCustomerId(clientId: number, stripeCustomerId: string, poolClient: PoolClient): Promise<void>;

    // Payment Method related
    addPaymentMethod(clientId: number, stripePaymentMethodId: string, cardBrand: string | null, cardLast4: string | null, cardExpMonth: number | null, cardExpYear: number | null, isDefault: boolean): Promise<PaymentMethod>;
    getClientPaymentMethods(clientId: number): Promise<PaymentMethod[]>;
    findPaymentMethodByStripeId(stripePaymentMethodId: string): Promise<PaymentMethod | null>;
    deletePaymentMethod(paymentMethodId: number): Promise<void>;
    setDefaultPaymentMethod(clientId: number, paymentMethodId: number): Promise<void>;

    // Payment Intent / Payment related
    createPaymentRecord(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>, poolClient: PoolClient): Promise<Payment>;
    updatePaymentStatus(paymentIntentId: string, status: string, poolClient: PoolClient): Promise<any>;
    findPaymentByIntentId(paymentIntentId: string): Promise<Payment | null>;
}
