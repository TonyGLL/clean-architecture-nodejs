import { Router } from "express";
import { container } from "../../ioc/config";
import { OrdersController } from "../controllers/orders.ctrl";
import { expressValidatorErrors } from "../middlewares/validator.middleware";

const router = Router();
const controller = container.get<OrdersController>(OrdersController);

router
    .get("/", expressValidatorErrors, controller.getAllOrders)
    ;

export default router;