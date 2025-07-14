import { Router } from "express";
import stripeRouter from './stripe.routes';

const router = Router();

router
    .use('/stripe', stripeRouter);

export default router;
