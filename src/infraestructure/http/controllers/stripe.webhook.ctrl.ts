import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { IPaymentService } from "../../../domain/services/payment.service";
import { DOMAIN_TYPES } from "../../../domain/ioc.types";
import { IPaymentRepository } from "../../../domain/repositories/payment.repository";
import { ICartRepository } from "../../../domain/repositories/cart.repository";
import { HttpStatusCode } from "../../../domain/shared/http.status";
import { config } from "../../config/env";
import Stripe from "stripe";
import { INFRASTRUCTURE_TYPES } from "../../ioc/types";
import { Pool } from "pg";
import { IOrderRepository } from "../../../domain/repositories/order.repository";
import { ConfirmPaymentUseCase } from "../../../application/use-cases/stripe.use-case";
import { ConfirmPaymentDTO } from "../../../application/dtos/payment.dto";

@injectable()
export class StripeWebhookController {
    private webhookSecret: string;

    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(ConfirmPaymentUseCase) private confirmPaymentUseCase: ConfirmPaymentUseCase,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) {
        this.webhookSecret = config.STRIPE_WEBHOOK_SECRET;
        if (!this.webhookSecret) {
            console.warn("STRIPE_WEBHOOK_SECRET is not set. Webhook processing will fail signature verification.");
        }
    }

    public handleWebhook = async (req: Request, res: Response, _: NextFunction): Promise<void> => {
        const sig = req.headers['stripe-signature'];
        let event: Stripe.Event;

        try {
            if (!sig) {
                console.error("Webhook error: Missing Stripe signature.");
                res.status(HttpStatusCode.BAD_REQUEST).send(`Webhook Error: Missing signature`);
                return;
            }
            if (!this.webhookSecret) {
                console.error("Webhook error: Missing webhook secret configuration.");
                res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(`Webhook Error: Server configuration error`);
                return;
            }
            event = this.paymentService.constructWebhookEvent(req.body, sig, this.webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            res.status(HttpStatusCode.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
            return;
        }

        switch (event.type) {
            case 'checkout.session.completed':
                const checkoutSessionCompleted = event.data.object as Stripe.Checkout.Session;
                console.log(`PaymentIntent succeeded: ${checkoutSessionCompleted.id}`);
                await this.handleCheckoutSessionCompleted(checkoutSessionCompleted);
                break;
            /* case 'payment_intent.created':
                const paymentIntentCreated = event.data.object as Stripe.PaymentIntent;
                console.log(`PaymentIntent Created: ${paymentIntentCreated.id}`);
                await this.handlePaymentIntentCreated(paymentIntentCreated);
                break; */
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
                console.log(`PaymentIntent succeeded: ${paymentIntentSucceeded.id}`);
                await this.handlePaymentIntentSucceeded(paymentIntentSucceeded);
                break;
            case 'payment_intent.payment_failed':
                const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
                console.log(`PaymentIntent failed: ${paymentIntentFailed.id}`);
                await this.handlePaymentIntentFailed(paymentIntentFailed);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.status(HttpStatusCode.OK).json({ received: true });
    }

    private async handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
        const poolClient = await this.pool.connect();

        try {
            await poolClient.query('BEGIN');

            //* Cambiar status del pago a pagado
            const updatePaymentStatusResponse = await this.paymentRepository.updatePaymentStatus(intent.id, intent.status, poolClient);

            //* Cambiar status de la orden
            await this.orderRepository.updateOrderStatus(updatePaymentStatusResponse?.orderId!, intent.status, poolClient);

            //* Cambiar status de carrito activo a completed
            await this.cartRepository.updateCartStatus(updatePaymentStatusResponse?.cartId!, intent.status, poolClient);

            //* Crear un nuevo carrito al usuario en curso
            await this.cartRepository.createCartFromLogin(updatePaymentStatusResponse?.clientId!, poolClient);

            await poolClient.query('COMMIT');
        } catch (error) {
            await poolClient.query('ROLLBACK');
        } finally {
            poolClient.release();
        }
    }

    private async handlePaymentIntentCreated(intent: Stripe.PaymentIntent) {
        const dto: ConfirmPaymentDTO = {
            clientId: 1,
            paymentIntentId: intent.id
        };

        await this.confirmPaymentUseCase.execute(dto);
    }

    private async handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
        /* await this.paymentRepository.updatePaymentStatus(
            intent.id,
            intent.status,
            intent.id,
            undefined,
            undefined,
            intent.payment_method_configuration_details
        );

        const cart = await this.cartRepository.findCartByPaymentIntent(intent.id);
        if (cart) {
            await this.cartRepository.updateCartStatus(cart.id, 'active');
            await this.cartRepository.updateCartPaymentIntent(cart.id, null);
        } */
        console.log(`Payment intent ${intent.id} failed. Status updated in DB and cart reactivated.`);
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        const poolClient = await this.pool.connect();

        try {
            await poolClient.query('BEGIN');

            const setupIntentId = session.setup_intent as string;
            const customerId = session.customer as string;

            const setupIntent = await this.paymentService.retrieveSetupIntent(setupIntentId);
            const paymentMethodId = setupIntent.payment_method as string;

            const paymentMethodParams: Stripe.PaymentMethodAttachParams = {
                customer: customerId
            };
            await this.paymentService.attachPaymentMethodToCustomer(paymentMethodId, paymentMethodParams);

            await poolClient.query('COMMIT');
        } catch (error) {
            await poolClient.query('ROLLBACK');
        } finally {
            poolClient.release();
        }
    }
}
