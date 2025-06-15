import express, { Request, Response, type Application } from "express";
import mainRouter from "../infraestructure/http/routes";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "../infraestructure/http/middlewares/error.handler";

class App {
    public express: Application;

    constructor() {
        this.express = express();
        this.middlewares();
        this.routes();
        this.express.use(errorHandler);
    }

    private middlewares(): void {
        this.express.use(cors({ origin: '*' }));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(morgan('dev'));
        this.express.use(helmet());
    }

    private routes(): void {
        this.express.use('/health', (_: Request, res: Response) => { res.status(200).json({ ok: true }) });
        this.express.use('/api/v1', mainRouter);
    }
}

export default new App().express;