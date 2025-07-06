import { Router, Request, Response, NextFunction } from "express";
import { StripeWebhookController } from "../controllers/stripe.webhook.ctrl";
import { container } from "../../ioc/config";
import express from 'express';

const router = Router();
const controller = container.get<StripeWebhookController>(StripeWebhookController);

// Stripe requires the raw body to construct the event.
// The json middleware in app.ts would parse it, so we use a special route for webhooks
// that uses express.raw before our controller handles it.
router.post(
    '/',
    express.raw({type: 'application/json'}), // Use raw body parser for this route
    (req: Request, res: Response, next: NextFunction) => controller.handleWebhook(req, res, next)
);

export default router;
