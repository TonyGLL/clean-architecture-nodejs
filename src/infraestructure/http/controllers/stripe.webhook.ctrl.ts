import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { IPaymentService } from "../../../domain/services/payment.service";
import { DOMAIN_TYPES } from "../../../domain/ioc.types";
import { IPaymentRepository } from "../../../domain/repositories/payment.repository";
import { ICartRepository } from "../../../domain/repositories/cart.repository";
import { HttpStatusCode } from "../../../domain/shared/http.status";
import { CreateOrderUseCase } from "../../../application/use-cases/order.use-case";
import { config } from "../../config/env";
import Stripe from "stripe";

@injectable()
export class StripeWebhookController {
    private webhookSecret: string;

    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(CreateOrderUseCase) private createOrderUseCase: CreateOrderUseCase
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
            case 'payment_intent.created':
                const paymentIntentCreated = event.data.object as Stripe.PaymentIntent;
                console.log(`PaymentIntent Created: ${paymentIntentCreated.id}`);
                await this.handlePaymentIntentSucceeded(paymentIntentCreated);
                break;
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
        console.log(intent)
        const updatedPayment = await this.paymentRepository.updatePaymentStatus(
            intent.id,
            intent.status,
            intent.id
        );

        if (updatedPayment) {
            if (updatedPayment.orderId) {
                console.log(`Order ${updatedPayment.orderId} already exists for payment intent ${intent.id}.`);
                return;
            }

            const cartId = intent.metadata.cart_id ? parseInt(intent.metadata.cart_id) : updatedPayment.cartId;
            const clientId = intent.metadata.client_id ? parseInt(intent.metadata.client_id) : updatedPayment.clientId;

            if (!cartId || !clientId) {
                console.error(`Cannot create order for PI ${intent.id}: missing cartId or clientId.`);
                return;
            }

            try {
                await this.createOrderUseCase.execute({
                    clientId: clientId,
                    cartId: cartId,
                    paymentId: updatedPayment.id,
                    shippingAddress: "Default Shipping Address",
                    billingAddress: "Default Billing Address",
                });
                console.log(`Order created successfully for payment intent ${intent.id}`);
            } catch (error: any) {
                console.error(`CRITICAL: Order creation failed for PI ${intent.id} after successful payment: ${error.message}`, error);
            }
        } else {
            console.warn(`Payment record not found for succeeded payment intent ${intent.id}. Order creation might be impacted.`);
        }
    }

    private async handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
        await this.paymentRepository.updatePaymentStatus(
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
        }
        console.log(`Payment intent ${intent.id} failed. Status updated in DB and cart reactivated.`);
    }
}
