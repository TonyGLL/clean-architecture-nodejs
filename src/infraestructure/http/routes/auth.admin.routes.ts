import { Router } from "express";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { loginValidator, sendEmailValidator, restorePasswordValidator } from "../validators/auth.validator";
import { authRateLimiter } from "../middlewares/rate-limit.middleware";
import { container } from "../../ioc/config";
import { AuthAdminController } from "../controllers/auth.admin.ctrl";

const router = Router();
const controller = container.get<AuthAdminController>(AuthAdminController);

router
    .use(authRateLimiter)
    .post('/login', loginValidator, expressValidatorErrors, controller.login)
    .post('/send-email', sendEmailValidator, expressValidatorErrors, controller.sendEmail)
    .post('/restore-password', restorePasswordValidator, expressValidatorErrors, controller.restorePassword)
    ;

export default router;