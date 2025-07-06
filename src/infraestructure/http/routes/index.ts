import { Router } from 'express';
import mainAuthRouter from './client.routes';
import mainAdminRouter from './admin.routes';
import stripeWebhookRouter from './stripe.webhook.routes'; // Added

const mainRouter = Router();

mainRouter
    .use('/client', mainAuthRouter)
    .use('/admin', mainAdminRouter)
    .use('/stripe-webhooks', stripeWebhookRouter);

export default mainRouter;