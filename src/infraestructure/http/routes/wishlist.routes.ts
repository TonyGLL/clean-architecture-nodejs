import { Router } from 'express';
import { container } from '../../ioc/config';
import { WishlistController } from '../controllers/wishlist.ctrl';

const router = Router();
const controller = container.get<WishlistController>(WishlistController);

router
    .get('/', controller.getWishlists)
    .get('/:id', controller.getWishlist)
    ;

export default router;
