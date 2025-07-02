import express, { Request, Response, type Application } from "express";
import mainRouter from "../infraestructure/http/routes";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "../infraestructure/http/middlewares/error.handler";
import { productsJob } from "../cron/products";

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
        // Iniciar cron jobs cuando la aplicación esté lista
        productsJob.start();
        console.log('Cron jobs started');
    }

    private middlewares(): void {
        this.express.use(cors({ origin: '*' }));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(morgan('dev'));
        this.express.use(helmet());
    }

    private routes(): void {
        this.express.use('/health', (_: Request, res: Response) => {
            res.status(200).json({
                ok: true,
                cronJobStatus: productsJob.isActive ? 'running' : 'stopped'
            })
        });
        this.express.use('/api/v1', mainRouter);
    }
}

export default new App().express;