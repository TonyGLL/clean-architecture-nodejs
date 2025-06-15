import { Request, Response, Router } from "express";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { loginValidator, registerValidator } from "../validators/auth.validator";
import { container } from "../../ioc/config";
import { AuthController } from "../controllers/auth.ctrl";

const router = Router();
const controller = container.get<AuthController>(AuthController);

router.post('/login', loginValidator, expressValidatorErrors, controller.login);
router.post('/register', registerValidator, expressValidatorErrors, controller.register);

export default router;