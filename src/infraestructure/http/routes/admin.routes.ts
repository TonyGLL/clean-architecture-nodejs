import { Router } from 'express';
import roleRoutes from './role.routes';
import { authMiddleware } from '../middlewares/auth.middleware';
import userRoutes from './user.routes';
import catalogsRoutes from './catalogs.routes';
import authAdminRouter from './auth.admin.routes';

const mainAdminRouter = Router();

mainAdminRouter
    .use('/auth', authAdminRouter)
    .use('/', authMiddleware)
    .use('/roles', roleRoutes)
    .use('/catalogs', catalogsRoutes)
    .use('/users', userRoutes);

export default mainAdminRouter;