jest.mock('../../infraestructure/config/env', () => ({ config: {} })); // no REDIS_URL -> in-memory store

import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { authRateLimiter } from '../../infraestructure/http/middlewares/rate-limit.middleware';

describe('authRateLimiter', () => {
    let server: http.Server;
    let url: string;

    beforeAll(done => {
        const app = express();
        app.use(authRateLimiter);
        app.post('/login', (_, res) => { res.json({ ok: true }); });
        server = app.listen(0, () => {
            url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/login`;
            done();
        });
    });

    afterAll(done => { server.close(done); });

    it('answers 429 once the per-IP limit is exceeded', async () => {
        const statuses: number[] = [];
        for (let i = 0; i < 21; i++) statuses.push((await fetch(url, { method: 'POST' })).status);

        expect(statuses.slice(0, 20).every(s => s === 200)).toBe(true);
        expect(statuses[20]).toBe(429);
    });
});
