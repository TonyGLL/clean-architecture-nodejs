import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { IStripeService } from "../../../domain/services/stripe.service";
import { DOMAIN_TYPES } from "../../../domain/ioc.types";
import { IStripePaymentRepository } from "../../../domain/repositories/stripe.payment.repository";
import { ICartRepository } from "../../../domain/repositories/cart.repository";
import { HttpStatusCode } from "../../../domain/shared/http.status";
import { config } from "../../config/env";
import Stripe from "stripe";
import { INFRASTRUCTURE_TYPES } from "../../ioc/types";
import { Pool } from "pg";
import { IOrderRepository } from "../../../domain/repositories/order.repository";
import { logger } from "../../config/winston";
import { ICouponsRepository } from "../../../domain/repositories/coupons.repository";

@injectable()
export class StripeWebhookController {
    private webhookSecret: string;

    constructor(
        @inject(DOMAIN_TYPES.IStripeService) private stripeService: IStripeService,
        @inject(DOMAIN_TYPES.IStripePaymentRepository) private stripePaymentRepository: IStripePaymentRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(DOMAIN_TYPES.ICouponsRepository) private couponRepository: ICouponsRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) {
        this.webhookSecret = config.STRIPE_WEBHOOK_SECRET;
    }

    public handleWebhook = async (req: Request, res: Response, _: NextFunction): Promise<void> => {
        const sig = req.headers['stripe-signature'];
        let event: Stripe.Event;

        try {
            if (!sig) {
                logger.warn("Webhook error: Missing Stripe signature.");
                res.status(HttpStatusCode.BAD_REQUEST).send(`Webhook Error: Missing signature`);
                return;
            }
            if (!this.webhookSecret) {
                logger.error("Webhook error: Missing webhook secret configuration.");
                res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(`Webhook Error: Server configuration error`);
                return;
            }
            event = this.stripeService.constructWebhookEvent(req.body, sig, this.webhookSecret);
        } catch (err: any) {
            logger.warn(`Webhook signature verification failed: ${err.message}`);
            res.status(HttpStatusCode.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
            return;
        }

        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
                    break;
                default:
                    logger.info(`Unhandled Stripe event type ${event.type}`);
            }
        } catch (error) {
            // Respond 5xx so Stripe retries the delivery instead of silently losing the payment confirmation
            logger.error(`Stripe webhook ${event.id} (${event.type}) failed`, { error });
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ received: false });
            return;
        }

        res.status(HttpStatusCode.OK).json({ received: true });
    }

    private async handlePaymentIntentSucceeded(event: Stripe.Event) {
        const intent = event.data.object as Stripe.PaymentIntent;
        const poolClient = await this.pool.connect();

        try {
            await poolClient.query('BEGIN');

            // Idempotency: Stripe may deliver the same event more than once
            const isNewEvent = await this.stripePaymentRepository.recordProviderEvent(event.id, event.type, event, poolClient);
            if (!isNewEvent) {
                await poolClient.query('ROLLBACK');
                logger.info(`Stripe event ${event.id} already processed, skipping`);
                return;
            }

            // Change payment status to paid
            const updatePaymentStatusResponse = await this.stripePaymentRepository.updatePaymentStatus(intent.id, intent.status, poolClient);

            if (!updatePaymentStatusResponse) throw new Error(`No payment record found for payment intent ${intent.id}`);
            const { order_id, cart_id, client_id } = updatePaymentStatusResponse;

            // Change order status
            await this.orderRepository.updateOrderStatus(order_id, intent.status, poolClient);

            // Change active cart status to completed
            await this.cartRepository.updateCartStatus(cart_id, 'completed', poolClient);

            // Create a new cart for the current user
            await this.cartRepository.createCartFromLogin(client_id, poolClient);

            await this.couponRepository.addCouponRedemption(cart_id, client_id, order_id);

            await poolClient.query('COMMIT');
        } catch (error) {
            await poolClient.query('ROLLBACK');
            throw error;
        } finally {
            poolClient.release();
        }
    }

    private async handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
        // The cart stays active so the client can retry with another payment method.
        logger.warn(`Payment intent ${intent.id} failed`, { reason: intent.last_payment_error?.message });
    }
}
