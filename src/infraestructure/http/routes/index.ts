import { Router } from 'express';
import mainAuthRouter from './client.routes';
import mainAdminRouter from './admin.routes';

const mainRouter = Router();

mainRouter
    .use('/client', mainAuthRouter)
    .use('/admin', mainAdminRouter);

export default mainRouter;