import { Router } from 'express';
import authRouter from './auth.routes';
import roleRoutes from './role.routes';

const mainRouter = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/management', roleRoutes); // Grouping role routes under /management

export default mainRouter;