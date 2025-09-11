import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.ctrl';
import { container } from '../../ioc/config';
import { expressValidatorErrors } from '../middlewares/validator.middleware';

const router = Router();
const controller = container.get<ReviewsController>(ReviewsController);

router
    ;

export default router;