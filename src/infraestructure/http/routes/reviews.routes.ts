import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.ctrl';
import { container } from '../../ioc/config';
import { CreateReviewValidator, DeleteReviewValidator, GetProductReviewsValidator } from '../validators/reviews.validator';
import { expressValidatorErrors } from '../middlewares/validator.middleware';

const router = Router();
const controller = container.get<ReviewsController>(ReviewsController);

router
    .get('/:productId', GetProductReviewsValidator, expressValidatorErrors, controller.getProductReviews)
    .post('/:productId', CreateReviewValidator, expressValidatorErrors, controller.createReview)
    .delete('/:reviewId', DeleteReviewValidator, expressValidatorErrors, controller.deleteReview)
    ;

export default router;