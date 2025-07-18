import { Router } from 'express';
import authClientRouter from './auth.client.routes';
import productsRouter from './products.routes';
import paymentRouter from './payment.routes';
import addressRouter from './address.routes';
import cartRouter from './cart.routes';
import { authMiddleware } from '../middlewares/auth.middleware';

const mainAuthRouter = Router();

mainAuthRouter
    .use('/auth', authClientRouter)

    // Protected routes
    .use(authMiddleware)

    .use('/cart', cartRouter)
    .use('/products', productsRouter)
    .use('/payments', paymentRouter)
    .use('/address', addressRouter);

export default mainAuthRouter;