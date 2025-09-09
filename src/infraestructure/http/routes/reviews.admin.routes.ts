import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.ctrl';
import { container } from '../../ioc/config';
import { DeleteReviewByAdminValidator, GetProductReviewsValidator, ModerateReviewByAdminValidator } from '../validators/reviews.validator';
import { expressValidatorErrors } from '../middlewares/validator.middleware';

const router = Router();
const controller = container.get<ReviewsController>(ReviewsController);

router
    .get('/:productId', GetProductReviewsValidator, expressValidatorErrors, controller.getProductReviews)
    .patch('/:productId/:status', ModerateReviewByAdminValidator, expressValidatorErrors, controller.moderateReviewByAdmin)
    .delete('/:reviewId', DeleteReviewByAdminValidator, expressValidatorErrors, controller.deleteReviewByAdmin)
    ;

export default router;