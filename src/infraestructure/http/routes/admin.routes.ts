import { Router } from 'express';
import roleRoutes from './role.routes';
import { adminAuthMiddleware } from '../middlewares/auth.middleware';
import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import userRoutes from './user.routes';
import catalogsRoutes from './catalogs.routes';
import authAdminRouter from './auth.admin.routes';
import reviewsAdminRoutes from './reviews.admin.routes';
import couponsAdminRoutes from './coupons.admin.routes';
import ordersRoutes from './orders.routes';

const mainAdminRouter = Router();

mainAdminRouter
    .use('/auth', authAdminRouter)

    // Middleware to check authentication and permissions
    .use(adminAuthMiddleware)
    // Middleware to check permissions for admin routes
    .use(permissionsMiddleware)

    // Protected routes for admin
    .use('/roles', roleRoutes)
    .use('/catalogs', catalogsRoutes)
    .use('/users', userRoutes)
    .use('/reviews', reviewsAdminRoutes)
    .use('/coupons', couponsAdminRoutes)
    .use('/orders', ordersRoutes)
    ;

export default mainAdminRouter;