import { Router } from 'express';
import roleRoutes from './role.routes';
import { authMiddleware } from '../middlewares/auth.middleware';
import userRoutes from './user.routes';

const mainAdminRouter = Router();

mainAdminRouter
    .use('/', authMiddleware)
    .use('/roles', roleRoutes)
    .use('/users', userRoutes);

export default mainAdminRouter;