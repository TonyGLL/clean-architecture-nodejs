import { PoolClient } from "pg";
import { Payment } from "../entities/payment";

export interface IPaypalPaymentRepository {
    findClientById(clientId: number): Promise<{ id: number; external_customer_id: string | null; email: string; name: string; } | null>;
    createPaymentRecord(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>, poolClient: PoolClient): Promise<Payment>;
    updatePaymentStatus(paymentIntentId: string, status: string, poolClient: PoolClient): Promise<any>;
    findPaymentByPaypalOrderId(paypalOrderId: string): Promise<Payment | null>;
}
