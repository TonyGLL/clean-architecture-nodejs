import { Router } from "express";
import { CartController } from "../controllers/cart.ctrl";
import { container } from "../../ioc/config";
import { expressValidatorErrors } from "../middlewares/validator.middleware";
import { AddProductToCartValidator, ApplyCouponToCartValidator, DeleteProductFromCart, LinkAddressToCartValidator } from "../validators/cart.validator";

const router = Router();
const controller = container.get<CartController>(CartController);

router
    .get('/', controller.getCart)
    .post('/add/:id', AddProductToCartValidator, expressValidatorErrors, controller.addProductToCart)
    .post('/address/:id', LinkAddressToCartValidator, expressValidatorErrors, controller.linkAddressToCart)
    .delete('/delete/:id', DeleteProductFromCart, expressValidatorErrors, controller.deleteProductFromCart)
    .delete('/clear', controller.clearCart)
    .post('/coupons/:code', ApplyCouponToCartValidator, expressValidatorErrors, controller.applyCouponToCart)
    .delete('/coupons', controller.removeCouponFromCart)
    ;

export default router;