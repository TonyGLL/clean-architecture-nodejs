import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.ctrl';
import { container } from '../../ioc/config';
import { GetProductReviewsValidator } from '../validators/reviews.validator';
import { expressValidatorErrors } from '../middlewares/validator.middleware';

const router = Router();
const controller = container.get<ReviewsController>(ReviewsController);

router
    .get('/:productId', GetProductReviewsValidator, expressValidatorErrors, controller.getProductReviews)

export default router;