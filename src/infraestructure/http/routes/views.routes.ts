import { Request, Response, Router } from "express";
import { config } from "../../config/env";

/**
 * Demo pages to try the Stripe.js flow in a browser. Only mounted when ENABLE_DEMO_VIEWS=true (see main/app.ts).
 * The pages hold no data: saved cards and every payment action go through the authenticated API
 * with the client's JWT (public/js/*.js).
 */
const router = Router();

router.get('/checkout', (_: Request, res: Response) => {
    res.render('checkout', { stripePublicKey: config.STRIPE_PUBLIC_KEY });
});

router.get('/add-card', (_: Request, res: Response) => {
    res.render('add-card', { stripePublicKey: config.STRIPE_PUBLIC_KEY });
});

router.get('/success', (req: Request, res: Response) => {
    const orderId = typeof req.query.order_id === 'string' ? req.query.order_id : '';
    res.render('success', { orderId });
});

export default router;
