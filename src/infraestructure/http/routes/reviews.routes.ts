import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.ctrl';
import { container } from '../../ioc/config';
import { CreateReviewValidator, GetProductReviewsValidator } from '../validators/reviews.validator';
import { expressValidatorErrors } from '../middlewares/validator.middleware';

const router = Router();
const controller = container.get<ReviewsController>(ReviewsController);

router
    .get('/:productId', GetProductReviewsValidator, expressValidatorErrors, controller.getProductReviews)
    .post('/:productId', CreateReviewValidator, expressValidatorErrors, controller.createReview)

export default router;