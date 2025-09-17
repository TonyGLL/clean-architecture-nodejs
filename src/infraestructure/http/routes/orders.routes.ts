import { Router } from "express";
import { container } from "../../ioc/config";
import { OrdersController } from "../controllers/orders.ctrl";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { GetAllOrdersValidator } from "../validators/orders.validator";

const router = Router();
const controller = container.get<OrdersController>(OrdersController);

router
    .get("/", GetAllOrdersValidator, expressValidatorErrors, controller.getAllOrders)
    ;

export default router;