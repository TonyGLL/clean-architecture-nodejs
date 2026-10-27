import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const storage = new AsyncLocalStorage<{ requestId: string }>();

/** Request id of the request being handled (undefined outside a request, e.g. in the worker). */
export const getRequestId = (): string | undefined => storage.getStore()?.requestId;

/**
 * Assigns each request an id (reusing X-Request-Id from the load balancer when it looks sane),
 * returns it in the response header and makes it available to the logger through AsyncLocalStorage.
 */
export const requestContext = (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.header('x-request-id');
    const requestId = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-Id', requestId);
    storage.run({ requestId }, next);
};
