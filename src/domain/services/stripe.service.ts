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
     * Confirma un PaymentIntent existente en Stripe.
     *
     * @name confirmPaymentIntent
     * @param {string} paymentIntentId - El ID del PaymentIntent a confirmar.
     * @param {Stripe.PaymentIntentConfirmParams} [params] - Parámetros opcionales para la confirmación.
     * @returns {Promise<Stripe.Response<Stripe.PaymentIntent>>} Una promesa que resuelve con la respuesta de Stripe que contiene el PaymentIntent confirmado.
     * @throws {HttpError} Lanza un error HTTP 500 si la confirmación falla en Stripe.
     *
     * @example
     * const confirmed = await stripePaymentService.confirmPaymentIntent('pi_xxx');
     */
    confirmPaymentIntent(paymentIntentId: string, params?: Stripe.PaymentIntentConfirmParams): Promise<Stripe.Response<Stripe.PaymentIntent>>;

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

    /**
     * Asocia un método de pago a un cliente de Stripe.
     *
     * @name attachPaymentMethodToCustomer
     * @param {string} id - El ID del método de pago a asociar.
     * @param {Stripe.PaymentMethodAttachParams} params - Parámetros que incluyen el ID del cliente.
     * @returns {Promise<Stripe.Response<Stripe.PaymentMethod>>} Una promesa que resuelve con la respuesta de Stripe que contiene el método de pago asociado.
     * @throws {HttpError} Lanza un error HTTP 500 si la asociación falla en Stripe.
     *
     * @example
     * const paymentMethod = await stripePaymentService.attachPaymentMethodToCustomer('pm_xxx', { customer: 'cus_xxx' });
     */
    attachPaymentMethodToCustomer(id: string, params: Stripe.PaymentMethodAttachParams): Promise<Stripe.Response<Stripe.PaymentMethod>>;

    /**
     * Lista los métodos de pago de un cliente.
     *
     * @name listCustomerPaymentMethods
     * @param {Stripe.PaymentMethodListParams} params - Parámetros para listar los métodos de pago (customer, type).
     * @returns {Promise<Stripe.ApiListPromise<Stripe.PaymentMethod>>} Una promesa que resuelve con la lista de métodos de pago del cliente.
     * @throws {HttpError} Lanza un error HTTP 500 si la consulta falla en Stripe.
     *
     * @example
     * const methods = await stripePaymentService.listCustomerPaymentMethods({ customer: 'cus_xxx', type: 'card' });
     */
    listCustomerPaymentMethods(params: Stripe.PaymentMethodListParams): Promise<Stripe.ApiListPromise<Stripe.PaymentMethod>>;

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

    /**
     * Crea una sesión de Checkout en Stripe.
     *
     * @name createCheckoutSession
     * @param {Stripe.Checkout.SessionCreateParams} params - Parámetros para la creación de la sesión de Checkout (monto, moneda, customer, métodos de pago, etc).
     * @returns {Promise<Stripe.Response<Stripe.Checkout.Session>>} Una promesa que resuelve con la respuesta de Stripe que contiene la sesión de Checkout creada.
     * @throws {HttpError} Lanza un error HTTP 500 si la creación de la sesión falla en Stripe.
     *
     * @example
     * const session = await stripePaymentService.createCheckoutSession({
     *   payment_method_types: ['card'],
     *   line_items: [{ price: 'price_xxx', quantity: 1 }],
     *   mode: 'payment',
     *   success_url: 'https://tuapp.com/success',
     *   cancel_url: 'https://tuapp.com/cancel'
     * });
     */
    createCheckoutSession(params: Stripe.Checkout.SessionCreateParams): Promise<Stripe.Response<Stripe.Checkout.Session>>;

    /**
     * Recupera un SetupIntent por su ID.
     *
     * @name retrieveSetupIntent
     * @param {string} setupIntentId - El ID del SetupIntent a recuperar.
     * @returns {Promise<Stripe.Response<Stripe.SetupIntent>>} Una promesa que resuelve con la respuesta de Stripe que contiene el SetupIntent.
     * @throws {HttpError} Lanza un error HTTP 500 si la recuperación falla en Stripe.
     *
     * @example
     * const setupIntent = await stripePaymentService.retrieveSetupIntent('seti_xxx');
     */
    retrieveSetupIntent(setupIntentId: string): Promise<Stripe.Response<Stripe.SetupIntent>>;
}
