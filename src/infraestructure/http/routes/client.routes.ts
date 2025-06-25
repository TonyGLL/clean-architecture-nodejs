import { Router } from 'express';
import authClientRouter from './auth.client.routes';

const mainAuthRouter = Router();

mainAuthRouter
    .use('/auth', authClientRouter);

export default mainAuthRouter;