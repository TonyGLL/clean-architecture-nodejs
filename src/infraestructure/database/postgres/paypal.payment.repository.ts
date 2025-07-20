import { inject, injectable } from "inversify";
import { Pool, PoolClient } from "pg";
import { IPaypalPaymentRepository } from "../../../domain/repositories/paypal.payment.repository";
import { INFRASTRUCTURE_TYPES } from "../../ioc/types";
import { Payment } from "../../../domain/entities/payment";

@injectable()
export class PaypalPaymentRepository implements IPaypalPaymentRepository {
    constructor(@inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool) { }

    async findClientById(clientId: number): Promise<{ id: number; external_customer_id: string | null; email: string; name: string; } | null> {
        const result = await this.pool.query('SELECT id, external_customer_id, email, name FROM clients WHERE id = $1', [clientId]);
        return result.rows[0] || null;
    }

    async createPaymentRecord(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>, poolClient: PoolClient): Promise<Payment> {
        const { cartId, clientId, amount, currency, status, external_payment_id, payment_method_id, receipt_url, payment_date, orderId } = payment;
        const result = await poolClient.query(
            'INSERT INTO payments (cart_id, client_id, amount, currency, status, provider, external_payment_id, payment_method_id, receipt_url, payment_date, order_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [cartId, clientId, amount, currency, status, 'paypal', external_payment_id, payment_method_id, receipt_url, payment_date, orderId]
        );
        return result.rows[0];
    }

    async updatePaymentStatus(paymentIntentId: string, status: string, poolClient: PoolClient): Promise<any> {
        const result = await poolClient.query('UPDATE payments SET status = $1 WHERE external_payment_id = $2 RETURNING *', [status, paymentIntentId]);
        return result.rows[0];
    }

    async findPaymentByPaypalOrderId(paypalOrderId: string): Promise<Payment | null> {
        const result = await this.pool.query('SELECT * FROM payments WHERE external_payment_id = $1', [paypalOrderId]);
        return result.rows[0] || null;
    }
}
