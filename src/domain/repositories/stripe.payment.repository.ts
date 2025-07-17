import { PoolClient } from "pg";
import { Payment } from "../entities/payment";
import { PaymentMethod } from "../entities/paymentMethod";

/**
 * @interface IStripePaymentRepository
 * @desc Interface for Stripe payment repository
 */
export interface IStripePaymentRepository {
    /**
     * @method findClientById
     * @param {number} clientId
     * @returns {Promise<{ id: number; external_customer_id: string | null; email: string; name: string; } | null>}
     * @desc Find a client by ID
     */
    findClientById(clientId: number): Promise<{ id: number; external_customer_id: string | null; email: string; name: string; } | null>;

    /**
     * @method updateClientStripeCustomerId
     * @param {number} clientId
     * @param {string} stripeCustomerId
     * @returns {Promise<void>}
     * @desc Update client's Stripe customer ID
     */
    updateClientStripeCustomerId(clientId: number, stripeCustomerId: string): Promise<void>;

    /**
     * @method addPaymentMethod
     * @param {number} clientId
     * @param {string} stripePaymentMethodId
     * @param {(string | null)} cardBrand
     * @param {(string | null)} cardLast4
     * @param {(number | null)} cardExpMonth
     * @param {(number | null)} cardExpYear
     * @param {boolean} isDefault
     * @returns {Promise<PaymentMethod>}
     * @desc Add a payment method for a client
     */
    addPaymentMethod(clientId: number, stripePaymentMethodId: string, cardBrand: string | null, cardLast4: string | null, cardExpMonth: number | null, cardExpYear: number | null, isDefault: boolean): Promise<PaymentMethod>;

    /**
     * @method getClientPaymentMethods
     * @param {number} clientId
     * @returns {Promise<PaymentMethod[]>}
     * @desc Get all payment methods for a client
     */
    getClientPaymentMethods(clientId: number): Promise<PaymentMethod[]>;

    /**
     * @method findPaymentMethodByStripeId
     * @param {string} stripePaymentMethodId
     * @returns {Promise<PaymentMethod | null>}
     * @desc Find a payment method by its Stripe ID
     */
    findPaymentMethodByStripeId(stripePaymentMethodId: string): Promise<PaymentMethod | null>;

    /**
     * @method deletePaymentMethod
     * @param {number} paymentMethodId
     * @returns {Promise<void>}
     * @desc Delete a payment method
     */
    deletePaymentMethod(paymentMethodId: number): Promise<void>;

    /**
     * @method setDefaultPaymentMethod
     * @param {number} clientId
     * @param {number} paymentMethodId
     * @returns {Promise<void>}
     * @desc Set a payment method as default for a client
     */
    setDefaultPaymentMethod(clientId: number, paymentMethodId: number): Promise<void>;

    /**
     * @method createPaymentRecord
     * @param {Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>} payment
     * @param {PoolClient} poolClient
     * @returns {Promise<Payment>}
     * @desc Create a payment record
     */
    createPaymentRecord(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>, poolClient: PoolClient): Promise<Payment>;

    /**
     * @method updatePaymentStatus
     * @param {string} paymentIntentId
     * @param {string} status
     * @param {PoolClient} poolClient
     * @returns {Promise<any>}
     * @desc Update the status of a payment
     */
    updatePaymentStatus(paymentIntentId: string, status: string, poolClient: PoolClient): Promise<any>;

    /**
     * @method findPaymentByIntentId
     * @param {string} paymentIntentId
     * @returns {Promise<Payment | null>}
     * @desc Find a payment by its intent ID
     */
    findPaymentByIntentId(paymentIntentId: string): Promise<Payment | null>;
}
