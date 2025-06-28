import { Router } from "express";
import { ModulesController } from "../controllers/modules.ctrl";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { container } from "../../ioc/config";

const router = Router();
const controller = container.get<ModulesController>(ModulesController);

router
    .get('/', expressValidatorErrors, controller.getAllModules);

export default router;