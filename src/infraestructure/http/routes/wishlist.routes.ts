import { Router } from 'express';
import { container } from '../../ioc/config';
import { WishlistController } from '../controllers/wishlist.ctrl';
import { addProductToWishlistValidator, createWishlistValidator, updateWishlistValidator } from '../validators/wishlist.validator';
import { expressValidatorErrors } from '../middlewares/validator.middleware';
import { idParamValidator } from '../validators/general.validator';

const router = Router();
const controller = container.get<WishlistController>(WishlistController);

router
    .get('/', controller.getWishlists)
    .post('/', createWishlistValidator, expressValidatorErrors, controller.createWishlist)
    .post('/:id/products', addProductToWishlistValidator, expressValidatorErrors, controller.addProductToWishlist)
    .delete('/:id/products', addProductToWishlistValidator, expressValidatorErrors, controller.removeProductFromWishlist)
    .patch('/:id', updateWishlistValidator, expressValidatorErrors, controller.updateWishlist)
    .delete('/:id', idParamValidator, expressValidatorErrors, controller.deleteWishlist)
    .get('/:id', idParamValidator, expressValidatorErrors, controller.getWishlist)
    ;

export default router;
