import { Router } from 'express';
import mainClientRouter from './client.routes';
import mainAdminRouter from './admin.routes';

const mainRouter = Router();

mainRouter
    .use('/client', mainClientRouter)
    .use('/admin', mainAdminRouter);

export default mainRouter;