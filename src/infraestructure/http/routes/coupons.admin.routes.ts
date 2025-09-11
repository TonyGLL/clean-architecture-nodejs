import { Router } from 'express';
import { container } from '../../ioc/config';
import { expressValidatorErrors } from '../middlewares/validator.middleware';
import { CouponsController } from '../controllers/coupons.ctrl';
import { CreateCouponValidator, GetCouponsValidator, UpdateCouponValidator } from '../validators/coupons.validator';

const router = Router();
const controller = container.get<CouponsController>(CouponsController);

router
    .get('/', GetCouponsValidator, expressValidatorErrors, controller.getCoupons)
    .post('/', CreateCouponValidator, expressValidatorErrors, controller.createCoupon)
    .patch('/:couponId', UpdateCouponValidator, expressValidatorErrors, controller.updateCoupon)
    ;

export default router;