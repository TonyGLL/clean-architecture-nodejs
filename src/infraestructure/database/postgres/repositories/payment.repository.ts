import { Pool, PoolClient } from 'pg';
import { inject, injectable } from 'inversify';
import { IPaymentRepository } from '../../../../domain/repositories/payment.repository';
import { Payment } from '../../../../domain/entities/payment';
import { PaymentMethod } from '../../../../domain/entities/paymentMethod';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';

@injectable()
export class PostgresPaymentRepository implements IPaymentRepository {
    private pool: Pool;

    constructor(@inject(INFRASTRUCTURE_TYPES.PostgresPool) pool: Pool) {
        this.pool = pool;
    }

    async findClientById(clientId: number): Promise<{ id: number; stripe_customer_id: string | null; email: string; name: string; } | null> {
        const result = await this.pool.query(
            'SELECT id, stripe_customer_id, email, name FROM clients WHERE id = $1 AND deleted = FALSE',
            [clientId]
        );
        if (result.rows.length === 0) {
            return null;
        }
        const client = result.rows[0];
        return {
            id: client.id,
            stripe_customer_id: client.stripe_customer_id,
            email: client.email,
            name: client.name
        };
    }

    async updateClientStripeCustomerId(clientId: number, stripeCustomerId: string, client: PoolClient): Promise<void> {
        await client.query(
            'UPDATE clients SET stripe_customer_id = $1, updated_at = NOW() WHERE id = $2',
            [stripeCustomerId, clientId]
        );
    }

    async addPaymentMethod(
        clientId: number,
        stripePaymentMethodId: string,
        cardBrand: string | null,
        cardLast4: string | null,
        cardExpMonth: number | null,
        cardExpYear: number | null,
        isDefault: boolean
    ): Promise<PaymentMethod> {
        if (isDefault) {
            // Set other payment methods for this client to not be default
            await this.pool.query(
                'UPDATE payment_methods SET is_default = FALSE WHERE client_id = $1',
                [clientId]
            );
        }
        const result = await this.pool.query(
            `INSERT INTO payment_methods (client_id, stripe_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING id, client_id, stripe_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default, created_at, updated_at`,
            [clientId, stripePaymentMethodId, cardBrand, cardLast4, cardExpMonth, cardExpYear, isDefault]
        );
        return result.rows[0] as PaymentMethod;
    }

    async getClientPaymentMethods(clientId: number): Promise<PaymentMethod[]> {
        const result = await this.pool.query(
            'SELECT id, client_id, stripe_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default, created_at, updated_at FROM payment_methods WHERE client_id = $1 ORDER BY created_at DESC',
            [clientId]
        );
        return result.rows as PaymentMethod[];
    }

    async findPaymentMethodByStripeId(stripePaymentMethodId: string): Promise<PaymentMethod | null> {
        const result = await this.pool.query(
            'SELECT id, client_id, stripe_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default, created_at, updated_at FROM payment_methods WHERE stripe_payment_method_id = $1',
            [stripePaymentMethodId]
        );
        return result.rows.length > 0 ? result.rows[0] as PaymentMethod : null;
    }

    async deletePaymentMethod(paymentMethodId: number): Promise<void> {
        // Instead of deleting, you might want to mark as deleted or disassociate from client if Stripe API doesn't delete it
        // For now, direct deletion:
        await this.pool.query('DELETE FROM payment_methods WHERE id = $1', [paymentMethodId]);
    }

    async setDefaultPaymentMethod(clientId: number, paymentMethodId: number): Promise<void> {
        // First, set all other methods for this client to not be default
        await this.pool.query(
            'UPDATE payment_methods SET is_default = FALSE WHERE client_id = $1 AND id != $2',
            [clientId, paymentMethodId]
        );
        // Then, set the specified method as default
        await this.pool.query(
            'UPDATE payment_methods SET is_default = TRUE, updated_at = NOW() WHERE id = $1 AND client_id = $2',
            [paymentMethodId, clientId]
        );
    }

    async createPaymentRecord(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>, client: PoolClient): Promise<Payment> {
        const { orderId, cartId, amount, status, stripePaymentIntentId, paymentMethodDetails, receiptUrl, paymentDate } = payment;

        const result = await client.query(
            `INSERT INTO payments (order_id, cart_id, amount, status, stripe_payment_intent_id, payment_method, receipt_url, payment_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, order_id, cart_id, amount, status, stripe_payment_intent_id, payment_method, receipt_url, payment_date`,
            [orderId, cartId, amount, status, stripePaymentIntentId, paymentMethodDetails, receiptUrl, paymentDate]
        );
        return result.rows[0] as Payment;
    }

    public async updatePaymentStatus(paymentIntentId: string, status: string, poolClient: PoolClient): Promise<Payment | null> {
        const existingPayment = await this.findPaymentByIntentId(paymentIntentId);
        if (!existingPayment) return null;

        const updates = { status, updated_at: new Date() };

        const query = `
            UPDATE payments
            SET status = $1, updated_at = $2
            WHERE stripe_payment_intent_id = $3
            RETURNING id, order_id, cart_id, client_id, amount, currency, status, stripe_payment_intent_id, stripe_charge_id, payment_method_details, receipt_url, payment_date, created_at, updated_at
        `;
        const values = [updates.status, updates.updated_at, paymentIntentId];

        const result = await poolClient.query(query, values);
        return result.rows.length > 0 ? result.rows[0] as Payment : null;
    }

    public async findPaymentByIntentId(paymentIntentId: string): Promise<Payment | null> {
        const result = await this.pool.query(
            'SELECT * FROM payments WHERE stripe_payment_intent_id = $1',
            [paymentIntentId]
        );
        return result.rows.length > 0 ? result.rows[0] as Payment : null;
    }
}
