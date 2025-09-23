import express, { Request, Response, type Application } from "express";
import mainRouter from "../infraestructure/http/routes";
import viewsRouter from "../infraestructure/http/routes/views.routes";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "../infraestructure/http/middlewares/error.handler";
import { productsJob } from "../cron/products";
import stripeWebhookRouter from '../infraestructure/http/routes/stripe.webhook.routes';
import path from 'path';

class App {
    public express: Application;

    constructor() {
        this.express = express();
        this.middlewares();
        this.routes();
        this.express.use(errorHandler);
        this.startCronJobs();
    }

    public startCronJobs(): void {
        productsJob.start();
    }

    private middlewares(): void {
        const corsOptions = {
            origin: 'http://localhost:4200'
        };
        this.express.use(cors(corsOptions));
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(morgan('dev'));
        this.express.use(helmet({
            contentSecurityPolicy: false
        }));
    }

    private routes(): void {
        this.express.use('/health', (_: Request, res: Response) => {
            res.status(200).json({
                ok: true,
                cronJobStatus: productsJob.isActive ? 'running' : 'stopped'
            })
        });

        this.express.use('/api/v1/stripe-webhooks', stripeWebhookRouter);
        this.express.use(express.json());

        //* EJS Config
        this.express.set('view engine', 'ejs');

        const viewsPath = path.join(__dirname, '../views');
        this.express.set('views', viewsPath);

        const publicPath = path.join(__dirname, '../../public');
        this.express.use(express.static(publicPath));

        this.express.use('/', viewsRouter);

        this.express.use('/api/v1', mainRouter);
    }
}

export default new App().express;