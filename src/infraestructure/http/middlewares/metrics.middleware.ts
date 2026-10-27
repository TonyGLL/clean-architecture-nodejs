import { NextFunction, Request, Response } from 'express';
import client from 'prom-client';

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
});

/** Records request duration by method, route pattern (not raw URL, to keep cardinality low) and status. */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const end = httpDuration.startTimer();
    res.on('finish', () => {
        const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : 'unmatched';
        end({ method: req.method, route, status: res.statusCode });
    });
    next();
};

export const metricsHandler = async (_: Request, res: Response) => {
    res.setHeader('Content-Type', registry.contentType);
    res.send(await registry.metrics());
};
