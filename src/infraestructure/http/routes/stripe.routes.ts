import { Router } from "express";
import { container } from "../../ioc/config";
import { CreatePaymentIntentValidator, DeletePaymentMethodValidator, PaymentMethodValidator } from "../validators/payment.validator";
import { StripeController } from "../controllers/stripe.ctrl";
import { checkCartMiddleware } from "../middlewares/check-cart.middleware";

const router = Router();
const controller = container.get<StripeController>(StripeController);

router
    .get('/payment-methods', controller.getClientPaymentMethods)
    .delete('/payment-methods/:paymentMethodId', DeletePaymentMethodValidator, controller.deletePaymentMethod)

    // Verify some necessary conditions to proceed with the payment
    .use(checkCartMiddleware)
    .post('/create-payment-intent', CreatePaymentIntentValidator, controller.createPaymentIntent)
    .post('/create-setup-intent', controller.createSetupIntent)
    .post('/payment-methods', PaymentMethodValidator, controller.addPaymentMethod);

export default router;
