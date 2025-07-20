import Stripe from 'stripe';

export interface IStripeService {
    /**
     * Creates a new customer in Stripe.
     *
     * @name createCustomer
     * @param {Stripe.CustomerCreateParams} params - Parameters for customer creation, such as email, name, description, etc.
     * @returns {Promise<Stripe.Response<Stripe.Customer>>} A promise that resolves with the Stripe response containing the created customer.
     * @throws {HttpError} Throws an HTTP 500 error if customer creation fails in Stripe.
     *
     * @example
     * const customer = await stripePaymentService.createCustomer({
     *   email: 'user@example.com',
     *   name: 'Name Lastname',
     *   description: 'Example customer'
     * });
     */
    createCustomer(params: Stripe.CustomerCreateParams): Promise<Stripe.Response<Stripe.Customer>>;

    /**
     * Creates a new PaymentIntent in Stripe.
     *
     * @name createPaymentIntent
     * @param {Stripe.PaymentIntentCreateParams} params - Parameters for PaymentIntent creation (amount, currency, customer, etc).
     * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>} A promise that resolves with the Stripe response containing the created PaymentIntent.
     * @throws {HttpError} Throws an HTTP 500 error if PaymentIntent creation fails in Stripe.
     *
     * @example
     * const paymentIntent = await stripePaymentService.createPaymentIntent({
     *   amount: 1000,
     *   currency: 'usd',
     *   customer: 'cus_xxx'
     * });
     */
    createPaymentIntent(params: Stripe.PaymentIntentCreateParams): Promise<Stripe.Response<Stripe.PaymentIntent>>;

    /**
     * Retrieves a PaymentIntent by its ID.
     *
     * @name retrievePaymentIntent
     * @param {string} paymentIntentId - The ID of the PaymentIntent to retrieve.
     * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>} A promise that resolves with the Stripe response containing the PaymentIntent.
     * @throws {HttpError} Throws an HTTP 500 error if retrieval fails in Stripe.
     *
     * @example
     * const paymentIntent = await stripePaymentService.retrievePaymentIntent('pi_xxx');
     */
    retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>>;

    /**
     * Attaches a payment method to a customer in Stripe.
     *
     * @name attachPaymentMethod
     * @param {string} paymentMethodId - The ID of the payment method to attach.
     * @param {string} customerId - The ID of the customer to whom the payment method will be attached.
     * @returns {Promise<Stripe.Response<Stripe.PaymentMethod>>} A promise that resolves with the Stripe response containing the attached payment method.
     * @throws {HttpError} Throws an HTTP 500 error if the operation fails in Stripe.
     *
     * @example
     * const paymentMethod = await stripePaymentService.attachPaymentMethod('pm_xxx', 'cus_xxx');
     */
    attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.Response<Stripe.PaymentMethod>>;

    /**
     * Retrieves a payment method by its ID.
     *
     * @name retrievePaymentMethod
     * @param {string} paymentMethodId - The ID of the payment method to retrieve.
     * @returns {Promise<Stripe.Response<Stripe.PaymentMethod>>} A promise that resolves with the Stripe response containing the payment method.
     * @throws {HttpError} Throws an HTTP 500 error if retrieval fails in Stripe.
     *
     * @example
     * const paymentMethod = await stripePaymentService.retrievePaymentMethod('pm_xxx');
     */
    retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.Response<Stripe.PaymentMethod>>;

    /**
     * Detaches a payment method from a customer.
     *
     * @name detachPaymentMethod
     * @param {string} paymentMethodId - The ID of the payment method to detach.
     * @returns {Promise<Stripe.Response<Stripe.PaymentMethod>>} A promise that resolves with the Stripe response containing the detached payment method.
     * @throws {HttpError} Throws an HTTP 500 error if the operation fails in Stripe.
     *
     * @example
     * const detached = await stripePaymentService.detachPaymentMethod('pm_xxx');
     */
    detachPaymentMethod(paymentMethodId: string): Promise<Stripe.Response<Stripe.PaymentMethod>>;

    /**
     * Creates a SetupIntent to save a payment method for future use.
     *
     * @name createSetupIntent
     * @param {Stripe.SetupIntentCreateParams} params - Parameters for SetupIntent creation.
     * @returns {Promise<Stripe.Response<Stripe.SetupIntent>>} A promise that resolves with the Stripe response containing the created SetupIntent.
     * @throws {HttpError} Throws an HTTP 500 error if creation fails in Stripe.
     *
     * @example
     * const setupIntent = await stripePaymentService.createSetupIntent({ customer: 'cus_xxx' });
     */
    createSetupIntent(params: Stripe.SetupIntentCreateParams): Promise<Stripe.Response<Stripe.SetupIntent>>;

    /**
     * Constructs and validates a webhook event received from Stripe.
     *
     * @name constructWebhookEvent
     * @param {string | Buffer} payload - The raw body received in the webhook.
     * @param {string | string[] | Buffer} sig - The Stripe-Signature header of the webhook.
     * @param {string} secret - The webhook endpoint secret.
     * @returns {Stripe.Event} The validated Stripe event.
     * @throws {HttpError} Throws an HTTP 400 error if validation fails.
     *
     * @example
     * const event = stripePaymentService.constructWebhookEvent(req.body, req.headers['stripe-signature'], webhookSecret);
     */
    constructWebhookEvent(payload: string | Buffer, sig: string | string[] | Buffer, secret: string): Stripe.Event;
}
