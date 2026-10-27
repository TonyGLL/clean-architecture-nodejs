import 'reflect-metadata';

jest.mock('../../infraestructure/config/env', () => ({ config: { STRIPE_WEBHOOK_SECRET: 'whsec_test' } }));
jest.mock('../../infraestructure/config/winston', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

import { StripeWebhookController } from '../../infraestructure/http/controllers/stripe.webhook.ctrl';

const payment = { order_id: 10, cart_id: 20, client_id: 30 };

const build = () => {
    const poolClient = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
    const stripeService = { constructWebhookEvent: jest.fn() };
    const stripePaymentRepository = { updatePaymentStatus: jest.fn().mockResolvedValue(payment), recordProviderEvent: jest.fn().mockResolvedValue(true) };
    const cartRepository = { updateCartStatus: jest.fn(), createCartFromLogin: jest.fn() };
    const orderRepository = { updateOrderStatus: jest.fn() };
    const couponRepository = { addCouponRedemption: jest.fn() };
    const pool = { connect: jest.fn().mockResolvedValue(poolClient) };

    const controller = new StripeWebhookController(
        stripeService as any, stripePaymentRepository as any, cartRepository as any,
        orderRepository as any, couponRepository as any, pool as any,
    );
    return { controller, poolClient, stripeService, stripePaymentRepository, cartRepository, orderRepository, couponRepository };
};

const call = async (controller: StripeWebhookController, headers: Record<string, string> = { 'stripe-signature': 'sig' }) => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
    await controller.handleWebhook({ headers, body: Buffer.from('{}') } as any, res, jest.fn());
    return res;
};

const succeeded = { id: 'evt_1', type: 'payment_intent.succeeded', data: { object: { id: 'pi_1', status: 'succeeded' } } };

describe('StripeWebhookController', () => {
    it('rejects requests without a signature', async () => {
        const { controller } = build();
        const res = await call(controller, {});
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects requests whose signature verification fails', async () => {
        const { controller, stripeService } = build();
        stripeService.constructWebhookEvent.mockImplementation(() => { throw new Error('bad sig'); });
        const res = await call(controller);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('commits the transaction and acknowledges a succeeded payment', async () => {
        const { controller, stripeService, poolClient, orderRepository, cartRepository, couponRepository } = build();
        stripeService.constructWebhookEvent.mockReturnValue(succeeded);
        const res = await call(controller);

        expect(orderRepository.updateOrderStatus).toHaveBeenCalledWith(10, 'succeeded', poolClient);
        expect(cartRepository.updateCartStatus).toHaveBeenCalledWith(20, 'completed', poolClient);
        expect(couponRepository.addCouponRedemption).toHaveBeenCalledWith(20, 30, 10);
        expect(poolClient.query).toHaveBeenLastCalledWith('COMMIT');
        expect(poolClient.release).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rolls back and answers 500 so Stripe retries when processing fails', async () => {
        const { controller, stripeService, poolClient, orderRepository } = build();
        stripeService.constructWebhookEvent.mockReturnValue(succeeded);
        orderRepository.updateOrderStatus.mockRejectedValue(new Error('db down'));
        const res = await call(controller);

        expect(poolClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(poolClient.release).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('fails clearly when no payment record matches the intent', async () => {
        const { controller, stripeService, stripePaymentRepository, poolClient } = build();
        stripeService.constructWebhookEvent.mockReturnValue(succeeded);
        stripePaymentRepository.updatePaymentStatus.mockResolvedValue(null);
        const res = await call(controller);

        expect(poolClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('skips events that were already processed (idempotency)', async () => {
        const { controller, stripeService, stripePaymentRepository, poolClient, orderRepository } = build();
        stripeService.constructWebhookEvent.mockReturnValue(succeeded);
        stripePaymentRepository.recordProviderEvent.mockResolvedValue(false);
        const res = await call(controller);

        expect(orderRepository.updateOrderStatus).not.toHaveBeenCalled();
        expect(poolClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('acknowledges unhandled event types', async () => {
        const { controller, stripeService } = build();
        stripeService.constructWebhookEvent.mockReturnValue({ id: 'evt_2', type: 'charge.refunded', data: { object: {} } });
        const res = await call(controller);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
