import { Router } from 'express';
import mainAuthRouter from './client.routes';
import mainAdminRouter from './admin.routes';
import paymentRouter from './payment.routes';
import stripeWebhookRouter from './stripe.webhook.routes'; // Added

const mainRouter = Router();

mainRouter
    .use('/client', mainAuthRouter)
    .use('/admin', mainAdminRouter)
    .use('/payments', paymentRouter)
    .use('/stripe-webhooks', stripeWebhookRouter); // Added Stripe webhook route

export default mainRouter;