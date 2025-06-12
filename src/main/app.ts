import express, { type Application } from "express";

class App {
    public express: Application;

    constructor() {
        this.express = express();
        this.middlewares();
        this.routes();
    }

    private middlewares(): void {
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: true }));
    }

    private routes(): void {
        this.express.use('/api/v1', () => { console.log('/api/v1') });
    }
}

export default new App().express;