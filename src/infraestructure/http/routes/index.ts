import { Router } from 'express';
import authRouter from './auth.routes';
import roleRoutes from './role.routes';

const mainRouter = Router();

mainRouter
    .use('/auth', authRouter)
    .use('/roles', roleRoutes)
    ;

export default mainRouter;