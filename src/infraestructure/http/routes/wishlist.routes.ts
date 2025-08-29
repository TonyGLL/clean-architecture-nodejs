import { Router } from 'express';
import { container } from '../../ioc/config';
import { WishlistController } from '../controllers/wishlist.ctrl';

const router = Router();
const controller = container.get<WishlistController>(WishlistController);

router
    .get('/', controller.getWishlists)
    .post('/', controller.createWishlist)
    /* .post('/add/:id', controller.getWishlist)
    .delete('/delete/:id', controller.getWishlist) */
    .patch('/:id', controller.getWishlist)
    .delete('/:id', controller.getWishlist)
    .get('/:id', controller.getWishlist)
    ;

export default router;
