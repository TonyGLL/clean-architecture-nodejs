import { Router } from "express";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { loginValidator, registerValidator, sendEmailValidator, restorePasswordValidator } from "../validators/auth.validator";
import { container } from "../../ioc/config";
import { AuthClientsController } from "../controllers/auth.clients.ctrl";

const router = Router();
const controller = container.get<AuthClientsController>(AuthClientsController);

router
    .post('/login', loginValidator, expressValidatorErrors, controller.login)
    .post('/register', registerValidator, expressValidatorErrors, controller.register)
    .post('/send-email', sendEmailValidator, expressValidatorErrors, controller.sendEmail)
    .post('/restore-password/:token', restorePasswordValidator, expressValidatorErrors, controller.restorePassword)
    ;

export default router;