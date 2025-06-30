import { Router } from 'express';
import roleRoutes from './role.routes';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionsMiddleware } from '../middlewares/permissions.middleware';
import userRoutes from './user.routes';
import catalogsRoutes from './catalogs.routes';
import authAdminRouter from './auth.admin.routes';
import modulesRoutes from './modules.routes';

const mainAdminRouter = Router();

mainAdminRouter.use('/auth', authAdminRouter);

// Apply authMiddleware to all subsequent routes in mainAdminRouter
mainAdminRouter.use(authMiddleware);
// Apply permissionsMiddleware after authMiddleware for all subsequent routes
mainAdminRouter.use(permissionsMiddleware);

// Protected routes
mainAdminRouter.use('/roles', roleRoutes);
mainAdminRouter.use('/catalogs', catalogsRoutes);
mainAdminRouter.use('/users', userRoutes);
mainAdminRouter.use('/modules', modulesRoutes);

export default mainAdminRouter;