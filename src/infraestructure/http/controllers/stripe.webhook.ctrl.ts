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
            event = this.stripeService.constructWebhookEvent(req.body, sig, this.webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            res.status(HttpStatusCode.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
            return;
        }

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
                await this.handlePaymentIntentSucceeded(paymentIntentSucceeded);
                break;
            case 'payment_intent.payment_failed':
                const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
                await this.handlePaymentIntentFailed(paymentIntentFailed);
                break;
            default:
                console.error(`Unhandled event type ${event.type}`);
        }

        res.status(HttpStatusCode.OK).json({ received: true });
    }

    private async handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
        const poolClient = await this.pool.connect();

        try {
            await poolClient.query('BEGIN');

            // Change payment status to paid
            const updatePaymentStatusResponse = await this.stripePaymentRepository.updatePaymentStatus(intent.id, intent.status, poolClient);

            // Change order status
            await this.orderRepository.updateOrderStatus(updatePaymentStatusResponse?.order_id!, intent.status, poolClient);

            // Change active cart status to completed
            await this.cartRepository.updateCartStatus(updatePaymentStatusResponse?.cart_id!, 'completed', poolClient);

            // Create a new cart for the current user
            await this.cartRepository.createCartFromLogin(updatePaymentStatusResponse?.client_id!, poolClient);

            await this.couponRepository.addCouponRedemption(updatePaymentStatusResponse?.cart_id!, updatePaymentStatusResponse?.client_id!, updatePaymentStatusResponse?.order_id!);

            await poolClient.query('COMMIT');
        } catch (error) {
            await poolClient.query('ROLLBACK');
        } finally {
            poolClient.release();
        }
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
    }
}
