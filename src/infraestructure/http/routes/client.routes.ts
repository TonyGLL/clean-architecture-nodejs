import { Router } from 'express';
import authClientRouter from './auth.client.routes';
import productsRouter from './products.routes';
import paymentRouter from './payment.routes';
import addressRouter from './address.routes';
import cartRouter from './cart.routes';
import wishlistRouter from './wishlist.routes';
import reviewsRouter from './reviews.routes';
import { authMiddleware } from '../middlewares/auth.middleware';

const mainClientRouter = Router();

mainClientRouter
    .use('/auth', authClientRouter)

    // Protected routes
    .use(authMiddleware)

    .use('/cart', cartRouter)
    .use('/products', productsRouter)
    .use('/payments', paymentRouter)
    .use('/address', addressRouter)
    .use('/wishlist', wishlistRouter)
    .use('/reviews', reviewsRouter);

export default mainClientRouter;