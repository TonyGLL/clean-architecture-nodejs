import { Router } from "express";
import { CartController } from "../controllers/cart.ctrl";
import { container } from "../../ioc/config";

const router = Router();
const controller = container.get<CartController>(CartController);

router
    .get('/', controller.getCart)
    .post('/add/:id', controller.addProductToCart)
    .post('/address/:id', controller.linkAddressToCart)
    .delete('/delete/:id', controller.deleteProductFromCart)
    .delete('/clear', controller.clearCart)
    .post('/coupons/:code', controller.applyCouponToCart)
    .delete('/coupons', controller.removeCouponFromCart)
    ;

export default router;