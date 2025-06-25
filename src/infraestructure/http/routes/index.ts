import { Router } from 'express';
import authRouter from './auth.routes';
import roleRoutes from './role.routes';
import { authMiddleware } from '../middlewares/auth.middleware';

const mainRouter = Router();

mainRouter
    .use('/auth', authRouter)
    // Auth Validation
    .use('/', authMiddleware)
    .use('/roles', roleRoutes)
    ;

export default mainRouter;