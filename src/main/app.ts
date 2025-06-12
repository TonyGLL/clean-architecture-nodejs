import express, { type Application } from "express";
import mainRouter from "../infraestructure/http/routes";
import morgan from "morgan";
import cors from "cors";

class App {
    public express: Application;

    constructor() {
        this.express = express();
        this.middlewares();
        this.routes();
    }

    private middlewares(): void {
        this.express.use(cors({ origin: '*' }));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(morgan('dev'));
    }

    private routes(): void {
        this.express.use('/api/v1', mainRouter);
    }
}

export default new App().express;