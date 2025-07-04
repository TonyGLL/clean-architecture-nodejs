import { Router } from "express";
import { CartController } from "../controllers/cart.ctrl";
import { container } from "../../ioc/config";

const router = Router();
const controller = container.get<CartController>(CartController);

router
    .get('/', controller.getCart)
    .post('/add/:id', controller.addProductToCart)
    .delete('/delete/:id', controller.deleteProductFromCart)
    .delete('/clear', controller.clearCart);

export default router;