import { Router } from "express";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { loginValidator, registerValidator, sendEmailValidator, restorePasswordValidator } from "../validators/auth.validator";
import { container } from "../../ioc/config";
import { AuthController } from "../controllers/auth.ctrl";

const router = Router();
const controller = container.get<AuthController>(AuthController);

router
    .post('/login', loginValidator, expressValidatorErrors, controller.login)
    .post('/register', registerValidator, expressValidatorErrors, controller.register)
    .post('/send-email', sendEmailValidator, expressValidatorErrors, controller.sendEmail)
    .post('/restore-password', restorePasswordValidator, expressValidatorErrors, controller.restorePassword)
    ;

export default router;