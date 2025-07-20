import { Router } from "express";
import { container } from "../../ioc/config";
import { PaypalController } from "../controllers/paypal.ctrl";

const router = Router();
const controller = container.get<PaypalController>(PaypalController);

router
    .post('/create-order', controller.createOrder)
    .post('/capture-order/:orderId', controller.captureOrder);

export default router;
