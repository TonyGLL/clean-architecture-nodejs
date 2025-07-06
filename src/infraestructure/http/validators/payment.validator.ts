import { body, param } from "express-validator";

export const PaymentMethodValidator = [
    body('stripePaymentMethodId').isString().withMessage('Stripe Payment Method ID must be a string.'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean.'),
];

export const DeletePaymentMethodValidator = [
    param('paymentMethodId').isString().withMessage('Payment Method ID must be a string.'),
];

export const CreatePaymentIntentValidator = [
    body('cartId').isInt({ gt: 0 }).withMessage('Cart ID must be a positive integer.'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'), // Validate as float, will be converted to cents in use case/service
    body('currency').isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code (e.g., MXN).'),
    body('paymentMethodId').optional().isString().withMessage('Payment Method ID must be a string if provided.'),
    body('saveCard').optional().isBoolean().withMessage('saveCard must be a boolean.'),
    body('confirm').optional().isBoolean().withMessage('confirm must be a boolean.'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object.'),
];

export const ConfirmPaymentValidator = [
    param('paymentIntentId').isString().withMessage('Payment Intent ID parameter must be a string.'),
    body('paymentMethodId').optional().isString().withMessage('Payment Method ID must be a string if provided.'),
    body('returnUrl').optional().isURL().withMessage('Return URL must be a valid URL.'),
];