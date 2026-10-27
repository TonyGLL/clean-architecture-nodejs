import { NextFunction, Request, Response } from 'express';
import { getRequestId, requestContext } from '../../infraestructure/http/middlewares/request-context.middleware';

const run = (incoming?: string) => {
    const res = { setHeader: jest.fn() } as unknown as Response;
    const req = { header: () => incoming } as unknown as Request;
    let seen: string | undefined;
    requestContext(req, res, (() => { seen = getRequestId(); }) as NextFunction);
    return { res, seen };
};

describe('requestContext', () => {
    it('generates an id, exposes it in the response and to getRequestId()', () => {
        const { res, seen } = run();
        expect(seen).toMatch(/^[0-9a-f-]{36}$/);
        expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', seen);
    });

    it('reuses a well-formed incoming X-Request-Id', () => {
        expect(run('abc12345-load-balancer').seen).toBe('abc12345-load-balancer');
    });

    it('ignores malformed incoming ids (log injection)', () => {
        const { seen } = run('bad id\nwith newline');
        expect(seen).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('has no request id outside a request', () => {
        expect(getRequestId()).toBeUndefined();
    });
});
