import express, { Request, Response, type Application } from "express";
import mainRouter from "../infraestructure/http/routes";
import viewsRouter from "../infraestructure/http/routes/views.routes";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "../infraestructure/http/middlewares/error.handler";
import stripeWebhookRouter from '../infraestructure/http/routes/stripe.webhook.routes';
import path from 'path';
import { config } from '../infraestructure/config/env';
import { getRedis, isRedisEnabled, withTimeout } from '../infraestructure/queue/redis';
import pool from '../infraestructure/database/postgres/config';

class App {
    public express: Application;

    constructor() {
        this.express = express();
        // Behind nginx / a cloud load balancer: trust the first proxy so req.ip (rate limiting) is the real client IP
        this.express.set('trust proxy', 1);
        this.middlewares();
        this.routes();
        this.express.use(errorHandler);
    }

    private middlewares(): void {
        const corsOptions = {
            origin: config.CORS_ORIGIN
        };
        this.express.use(cors(corsOptions));
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
        this.express.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "https://js.stripe.com/v3/"],
                    styleSrc: ["'self'", "'unsafe-inline'"], // EJS/inline styles might require this
                    frameSrc: ["'self'", "https://js.stripe.com/v3/"],
                    connectSrc: ["'self'", "https://api.stripe.com"],
                    imgSrc: ["'self'", "data:"], // Allow data URIs for images
                    fontSrc: ["'self'"],
                },
            },
        }));
    }

    private routes(): void {
        this.express.use('/health', (_: Request, res: Response) => {
            res.status(200).json({ ok: true })
        });

        // Readiness: verifies the DB is reachable (use for load balancer / orchestrator probes)
        this.express.use('/ready', async (_: Request, res: Response) => {
            try {
                await pool.query('SELECT 1');
                if (isRedisEnabled()) await withTimeout(getRedis().ping());
                res.status(200).json({ ok: true });
            } catch {
                res.status(503).json({ ok: false });
            }
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