import Stripe from 'stripe';

export interface IStripeService {
    /**
     * Crea un nuevo cliente en Stripe.
     *
     * @name createCustomer
     * @param {Stripe.CustomerCreateParams} params - Parámetros para la creación del cliente, como email, nombre, descripción, etc.
     * @returns {Promise<Stripe.Response<Stripe.Customer>>} Una promesa que resuelve con la respuesta de Stripe que contiene el cliente creado.
     * @throws {HttpError} Lanza un error HTTP 500 si la creación del cliente falla en Stripe.
     *
     * @example
     * const customer = await stripePaymentService.createCustomer({
     *   email: 'usuario@ejemplo.com',
     *   name: 'Nombre Apellido',
     *   description: 'Cliente de ejemplo'
     * });
     */
    createCustomer(params: Stripe.CustomerCreateParams): Promise<Stripe.Response<Stripe.Customer>>;

    /**
     * Crea un nuevo PaymentIntent en Stripe.
     *
     * @name createPaymentIntent
     * @param {Stripe.PaymentIntentCreateParams} params - Parámetros para la creación del PaymentIntent (monto, moneda, customer, etc).
     * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>} Una promesa que resuelve con la respuesta de Stripe que contiene el PaymentIntent creado.
     * @throws {HttpError} Lanza un error HTTP 500 si la creación del PaymentIntent falla en Stripe.
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
     * Recupera un PaymentIntent por su ID.
     *
     * @name retrievePaymentIntent
     * @param {string} paymentIntentId - El ID del PaymentIntent a recuperar.
     * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>} Una promesa que resuelve con la respuesta de Stripe que contiene el PaymentIntent.
     * @throws {HttpError} Lanza un error HTTP 500 si la recuperación falla en Stripe.
     *
     * @example
     * const paymentIntent = await stripePaymentService.retrievePaymentIntent('pi_xxx');
     */
    retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>>;

    attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.Response<Stripe.PaymentMethod>>;

    retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.Response<Stripe.PaymentMethod>>;

    /**
     * Desasocia un método de pago de un cliente.
     *
     * @name detachPaymentMethod
     * @param {string} paymentMethodId - El ID del método de pago a desasociar.
     * @returns {Promise<Stripe.Response<Stripe.PaymentMethod>>} Una promesa que resuelve con la respuesta de Stripe que contiene el método de pago desasociado.
     * @throws {HttpError} Lanza un error HTTP 500 si la operación falla en Stripe.
     *
     * @example
     * const detached = await stripePaymentService.detachPaymentMethod('pm_xxx');
     */
    detachPaymentMethod(paymentMethodId: string): Promise<Stripe.Response<Stripe.PaymentMethod>>;

    /**
     * Crea un SetupIntent para guardar un método de pago para uso futuro.
     *
     * @name createSetupIntent
     * @param {Stripe.SetupIntentCreateParams} params - Parámetros para la creación del SetupIntent.
     * @returns {Promise<Stripe.Response<Stripe.SetupIntent>>} Una promesa que resuelve con la respuesta de Stripe que contiene el SetupIntent creado.
     * @throws {HttpError} Lanza un error HTTP 500 si la creación falla en Stripe.
     *
     * @example
     * const setupIntent = await stripePaymentService.createSetupIntent({ customer: 'cus_xxx' });
     */
    createSetupIntent(params: Stripe.SetupIntentCreateParams): Promise<Stripe.Response<Stripe.SetupIntent>>;

    /**
     * Construye y valida un evento de webhook recibido desde Stripe.
     *
     * @name constructWebhookEvent
     * @param {string | Buffer} payload - El cuerpo crudo recibido en el webhook.
     * @param {string | string[] | Buffer} sig - La cabecera Stripe-Signature del webhook.
     * @param {string} secret - El secreto del endpoint de webhook.
     * @returns {Stripe.Event} El evento validado de Stripe.
     * @throws {HttpError} Lanza un error HTTP 400 si la validación falla.
     *
     * @example
     * const event = stripePaymentService.constructWebhookEvent(req.body, req.headers['stripe-signature'], webhookSecret);
     */
    constructWebhookEvent(payload: string | Buffer, sig: string | string[] | Buffer, secret: string): Stripe.Event;
}
