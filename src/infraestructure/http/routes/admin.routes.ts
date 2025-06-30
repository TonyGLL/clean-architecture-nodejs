import { Router } from 'express';
import roleRoutes from './role.routes';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import userRoutes from './user.routes';
import catalogsRoutes from './catalogs.routes';
import authAdminRouter from './auth.admin.routes';

const mainAdminRouter = Router();

mainAdminRouter
    .use('/auth', authAdminRouter)

    // Middleware to check authentication and permissions
    .use(authMiddleware)
    // Middleware to check permissions for admin routes
    .use(permissionsMiddleware)

    // Protected routes for admin
    .use('/roles', roleRoutes)
    .use('/catalogs', catalogsRoutes)
    .use('/users', userRoutes);

export default mainAdminRouter;