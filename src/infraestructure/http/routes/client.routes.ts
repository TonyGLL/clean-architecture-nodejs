import { Router } from 'express';
import authClientRouter from './auth.client.routes';
import productsRouter from './products.routes';
import { authMiddleware } from '../middlewares/auth.middleware';

const mainAuthRouter = Router();

mainAuthRouter
    .use('/auth', authClientRouter)

    // Protected routes
    .use(authMiddleware)

    .use('/products', productsRouter);

export default mainAuthRouter;