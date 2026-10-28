import { Router } from "express";
import { container } from "../../ioc/config";
import { ClientOrdersController } from "../controllers/client.orders.ctrl";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { OrderIdValidator } from "../validators/orders.validator";

const router = Router();
const controller = container.get<ClientOrdersController>(ClientOrdersController);

router
    .get("/", controller.getOrders)
    .get("/:id", OrderIdValidator, expressValidatorErrors, controller.getOrderById)
    ;

export default router;
