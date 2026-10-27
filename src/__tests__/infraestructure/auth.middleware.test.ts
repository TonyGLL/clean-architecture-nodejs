import 'reflect-metadata';
import { Request } from 'express';

const validateToken = jest.fn();
jest.mock('../../infraestructure/ioc/config', () => ({ container: { get: () => ({ validateToken }) } }));

import { clientAuthMiddleware } from '../../infraestructure/http/middlewares/auth.middleware';

const run = (payload: object) => {
    validateToken.mockReturnValue(payload);
    const next = jest.fn();
    const req = { headers: { authorization: 'Bearer abc' } } as unknown as Request;
    clientAuthMiddleware(req, {} as any, next);
    return { next, req };
};

describe('auth middleware', () => {
    it('accepts a regular access token and exposes the payload as req.user', () => {
        const { next, req } = run({ id: 1 });
        expect(next).toHaveBeenCalledWith();
        expect(req.user).toEqual({ id: 1 });
    });

    it('rejects password-reset tokens as access tokens', () => {
        const { next } = run({ id: 1, purpose: 'password-reset' });
        expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
    });
});
