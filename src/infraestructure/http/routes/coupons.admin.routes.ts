import { Router } from 'express';
import { container } from '../../ioc/config';
import { expressValidatorErrors } from '../middlewares/validator.middleware';
import { CouponsController } from '../controllers/coupons.ctrl';

const router = Router();
const controller = container.get<CouponsController>(CouponsController);

router
    .get('/', expressValidatorErrors, controller.getCoupons)
    .post('/', expressValidatorErrors, controller.createCoupon)
    .patch('/:couponId', expressValidatorErrors, controller.updateCoupon)
    ;

export default router;