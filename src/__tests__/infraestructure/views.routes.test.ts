import express from 'express';
import http from 'http';
import path from 'path';
import { AddressInfo } from 'net';

jest.mock('../../infraestructure/config/env', () => ({ config: { STRIPE_PUBLIC_KEY: 'pk_test_123' } }));

import viewsRouter from '../../infraestructure/http/routes/views.routes';

describe('demo views', () => {
    let server: http.Server;
    let base: string;

    beforeAll(done => {
        const app = express();
        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, '../../views'));
        app.use('/', viewsRouter);
        server = app.listen(0, () => {
            base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
            done();
        });
    });

    afterAll(done => { server.close(done); });

    it('renders checkout with the Stripe public key and no server-side card data', async () => {
        const html = await (await fetch(`${base}/checkout`)).text();
        expect(html).toContain('data-stripe-key="pk_test_123"');
        expect(html).toContain('id="saved-cards"');
        expect(html).not.toContain('ending in');
    });

    it('renders add-card', async () => {
        expect((await fetch(`${base}/add-card`)).status).toBe(200);
    });

    it('renders success and escapes the order reference', async () => {
        const response = await fetch(`${base}/success?order_id=${encodeURIComponent('<script>alert(1)</script>')}`);
        const html = await response.text();
        expect(response.status).toBe(200);
        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).not.toContain('<script>alert(1)</script>');
    });
});
