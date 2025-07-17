import { Request, Response, Router } from "express";
import pool from "../../database/postgres/config";
import { config } from "../../config/env";

const router = Router();

// Página de Checkout
router.get('/checkout', async (req: Request, res: Response) => {
    try {
        // En una app real, obtendrías el clientId de la sesión/token
        // Para el ejemplo, lo hardcodeamos o lo pasamos por query param
        const clientId = 1;
        const { rows: paymentMethods } = await pool.query(
            `SELECT id, card_brand, card_last4, external_payment_method_id FROM payment_methods WHERE client_id = $1`,
            [clientId]
        );

        res.render('checkout', {
            stripePublicKey: config.STRIPE_PUBLIC_KEY,
            paymentMethods: paymentMethods
        });
    } catch (error) {
        console.error('ERROR en /checkout:', error instanceof Error ? error.message : error);
        res.status(500).send('Error interno');
    }
});

// Página para añadir tarjeta
router.get('/add-card', (req: Request, res: Response) => {
    try {
        res.render('add-card', {
            stripePublicKey: config.STRIPE_PUBLIC_KEY
        });
    } catch (error) {
        console.error('ERROR en /add-card:', error instanceof Error ? error.message : error);
        res.status(500).send('Error interno');
    }
});

// Página de éxito
router.get('/success', (req: Request, res: Response) => {
    res.render('success', { orderId: req.query.order_id });
});

export default router;