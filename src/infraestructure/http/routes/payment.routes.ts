import { Router } from "express";
import { PaymentController } from "../controllers/payment.ctrl";
import { container } from "../../ioc/config";
import { authMiddleware } from "../middlewares/auth.middleware"; // Assuming this middleware verifies client token and adds user to req
import { validateFields } from "../middlewares/validate-fields.middleware";
import { body, param } from "express-validator";

const router = Router();
const controller = container.get<PaymentController>(PaymentController);

// Payment Methods routes
router.post(
    '/payment-methods',
    authMiddleware, // Protect route
    [
        body('stripePaymentMethodId').isString().withMessage('Stripe Payment Method ID must be a string.'),
        body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean.'),
        validateFields
    ],
    controller.addPaymentMethod
);

router.get(
    '/payment-methods',
    authMiddleware, // Protect route
    controller.getClientPaymentMethods
);

router.delete(
    '/payment-methods/:paymentMethodId', // Stripe Payment Method ID (pm_xxxx)
    authMiddleware, // Protect route
    [
        param('paymentMethodId').isString().withMessage('Payment Method ID parameter must be a string.'),
        validateFields
    ],
    controller.deletePaymentMethod
);

// Payment Intents routes
router.post(
    '/payment-intents',
    authMiddleware, // Protect route
    [
        body('cartId').isInt({ gt: 0 }).withMessage('Cart ID must be a positive integer.'),
        body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'), // Validate as float, will be converted to cents in use case/service
        body('currency').isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code (e.g., MXN).'),
        body('paymentMethodId').optional().isString().withMessage('Payment Method ID must be a string if provided.'),
        body('saveCard').optional().isBoolean().withMessage('saveCard must be a boolean.'),
        body('confirm').optional().isBoolean().withMessage('confirm must be a boolean.'),
        body('metadata').optional().isObject().withMessage('Metadata must be an object.'),
        validateFields
    ],
    controller.createPaymentIntent
);

router.post(
    '/payment-intents/:paymentIntentId/confirm',
    authMiddleware, // Protect route
    [
        param('paymentIntentId').isString().withMessage('Payment Intent ID parameter must be a string.'),
        body('paymentMethodId').optional().isString().withMessage('Payment Method ID must be a string if provided.'),
        validateFields
    ],
    controller.confirmPayment
);

export default router;
