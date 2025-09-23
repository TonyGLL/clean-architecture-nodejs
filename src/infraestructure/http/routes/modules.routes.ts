import { Router } from "express";
import { ModulesController } from "../controllers/modules.ctrl";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { container } from "../../ioc/config";
import { createModuleValidator, moduleIdValidator, updateModuleValidator } from "../validators/modules.validator";

const router = Router();
const controller = container.get<ModulesController>(ModulesController);

router
    .get('/', controller.getAllModules)
    .get('/:id', moduleIdValidator, expressValidatorErrors, controller.getModuleById)
    .post('/', createModuleValidator, expressValidatorErrors, controller.createModule)
    .put('/:id', updateModuleValidator, expressValidatorErrors, controller.updateModule)
    .delete('/:id', moduleIdValidator, expressValidatorErrors, controller.deleteModule);

export default router;