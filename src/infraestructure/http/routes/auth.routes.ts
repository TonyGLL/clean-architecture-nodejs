import { Request, Response, Router } from "express";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { loginValidator } from "../validators/auth.validator";

const router = Router();

router.post(
    '/login',
    loginValidator,
    expressValidatorErrors,
    (req: Request, res: Response) => { res.status(200).json({ message: 'GET from auth/' }) }
);

export default router;