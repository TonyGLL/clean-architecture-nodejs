import { Router } from 'express';
import roleRoutes from './role.routes';
import { authMiddleware } from '../middlewares/auth.middleware';

const mainAdminRouter = Router();

mainAdminRouter
    .use('/', authMiddleware)
    .use('/roles', roleRoutes);

export default mainAdminRouter;