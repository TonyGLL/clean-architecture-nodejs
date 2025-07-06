import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import Stripe from "stripe";
import { config } from "../../config/env";
import { IPaymentService } from "../../../domain/services/payment.service";
import { DOMAIN_TYPES } from "../../../domain/ioc.types";
import { IPaymentRepository } from "../../../domain/repositories/payment.repository";
import { IOrderRepository } from "../../../domain/repositories/order.repository";
import { ICartRepository } from "../../../domain/repositories/cart.repository";
import { HttpStatusCode } from "../../../domain/shared/http.status";
import { CreateOrderUseCase } from "../../../application/use-cases/order.use-case"; // To create order on successful payment if not already created

@injectable()
export class StripeWebhookController {
    private webhookSecret: string;

    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentGatewayService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository,
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository, // Optional: if order creation is finalized here
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository,
        @inject(CreateOrderUseCase) private createOrderUseCase: CreateOrderUseCase // Injected for creating order
    ) {
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!; // Ensure this is set in your .env
        if (!this.webhookSecret) {
            console.warn("STRIPE_WEBHOOK_SECRET is not set. Webhook processing will fail signature verification.");
            // In a real app, you might want to throw an error or prevent startup if the secret is missing.
        }
    }

    public handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            event = await this.paymentGatewayService.constructWebhookEvent(req.body, sig, this.webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            res.status(HttpStatusCode.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
            return;
        }

        // Persist the event to stripe_events table (optional, but good for auditing)
        // await this.logStripeEvent(event.id, event.type, event.data.object);


        // Handle the event
        switch (event.type) {
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
            case 'charge.succeeded': // Often handled via payment_intent.succeeded, but can be listened to.
                const chargeSucceeded = event.data.object as Stripe.Charge;
                console.log(`Charge succeeded: ${chargeSucceeded.id} for PI: ${chargeSucceeded.payment_intent}`);
                // You might update payment record with charge details if not already done via PI success.
                const paymentForCharge = await this.paymentRepository.findPaymentByIntentId(chargeSucceeded.payment_intent as string);
                if (paymentForCharge && paymentForCharge.status !== 'succeeded') {
                    await this.paymentRepository.updatePaymentStatus(
                        chargeSucceeded.payment_intent as string,
                        'succeeded', // or map Stripe charge status
                        chargeSucceeded.id,
                        chargeSucceeded.receipt_url,
                        new Date(chargeSucceeded.created * 1000),
                        chargeSucceeded.payment_method_details || undefined
                    );
                }
                break;
            // ... handle other event types as needed:
            // case 'payment_method.attached':
            // const paymentMethod = event.data.object as Stripe.PaymentMethod;
            // // Then define and call a method to handle the successful attachment of a PaymentMethod.
            // break;
            // case 'customer.subscription.created':
            // case 'invoice.payment_succeeded':
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.status(HttpStatusCode.OK).json({ received: true });
    }

    private async handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
        const charge = intent.charges?.data[0];
        const updatedPayment = await this.paymentRepository.updatePaymentStatus(
            intent.id,
            intent.status, // 'succeeded'
            charge?.id,
            charge?.receipt_url,
            charge ? new Date(charge.created * 1000) : new Date(),
            charge?.payment_method_details || undefined
        );

        if (updatedPayment) {
            // Check if an order already exists for this payment
            if (updatedPayment.orderId) {
                console.log(`Order ${updatedPayment.orderId} already exists for payment intent ${intent.id}. Updating status if necessary.`);
                // Optionally update order status if it wasn't already 'processing' or 'completed'
                const order = await this.orderRepository.findOrderById(updatedPayment.orderId);
                if (order && order.status === 'pending') { // Or other initial statuses
                    await this.orderRepository.updateOrderStatus(order.id, 'processing'); // Or directly to 'completed' if no processing step
                }
                return;
            }

            // If no order exists, create one.
            // This assumes metadata on PI contains necessary info like cartId, clientId, shipping/billing if not on payment record.
            const cartId = intent.metadata.cart_id ? parseInt(intent.metadata.cart_id) : updatedPayment.cartId;
            const clientId = intent.metadata.client_id ? parseInt(intent.metadata.client_id) : updatedPayment.clientId;

            // These would ideally be stored or retrievable, perhaps from client profile or cart metadata
            const defaultShippingAddress = "Default Shipping Address, City, Country";
            const defaultBillingAddress = "Default Billing Address, City, Country";

            if (!cartId || !clientId) {
                console.error(`Cannot create order for PI ${intent.id}: missing cartId or clientId in metadata or payment record.`);
                return;
            }

            try {
                // The CreateOrderUseCase will fetch the cart, verify payment, etc.
                // We pass the DB payment ID to the use case.
                await this.createOrderUseCase.execute({
                    clientId: clientId,
                    cartId: cartId,
                    paymentId: updatedPayment.id, // Pass the DB ID of the payment record
                    shippingAddress: intent.shipping?.address ?
                        `${intent.shipping.address.line1}, ${intent.shipping.address.city}, ${intent.shipping.address.postal_code}, ${intent.shipping.address.country}`
                        : defaultShippingAddress, // Fallback or fetch from client profile
                    billingAddress: defaultBillingAddress, // Fallback or fetch from client profile or use shipping
                });
                console.log(`Order created successfully for payment intent ${intent.id}`);
            } catch (error: any) {
                console.error(`Error creating order for PI ${intent.id} after successful payment: ${error.message}`, error);
                // Potentially flag this for manual review. The payment is successful, but order creation failed.
            }
        } else {
            console.warn(`Payment record not found for succeeded payment intent ${intent.id}. Order creation might be impacted.`);
        }
    }

    private async handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
        await this.paymentRepository.updatePaymentStatus(
            intent.id,
            intent.status, // 'payment_failed' or other failure status
            intent.charges?.data[0]?.id, // If a charge was attempted
            undefined, // No receipt URL for failed
            undefined, // No payment date
            intent.charges?.data[0]?.payment_method_details || undefined
        );

        // Optionally, update cart status back to 'active' or 'failed_payment'
        const cart = await this.cartRepository.findCartByPaymentIntent(intent.id);
        if (cart) {
            await this.cartRepository.updateCartStatus(cart.id, 'active'); // Or a specific status like 'payment_failed'
            // Consider clearing the active_payment_intent_id from the cart
            // await this.cartRepository.updateCartPaymentIntent(cart.id, null);
        }
        console.log(`Payment intent ${intent.id} failed. Status updated.`);
    }

    // private async logStripeEvent(eventId: string, eventType: string, payload: any) {
    //     try {
    //         // Implementation to save to stripe_events table in your DB
    //         // await this.pool.query(
    //         //  'INSERT INTO stripe_events (event_id, event_type, payload) VALUES ($1, $2, $3) ON CONFLICT (event_id) DO NOTHING',
    //         //  [eventId, eventType, payload]
    //         // );
    //     } catch (error) {
    //         console.error(`Error logging Stripe event ${eventId}:`, error);
    //     }
    // }
}
