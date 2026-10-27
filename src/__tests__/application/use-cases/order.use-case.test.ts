import 'reflect-metadata';

jest.mock('../../../infraestructure/config/winston', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

import { ExpirePendingOrdersUseCase, GetOrderByIdUseCase, UpdateOrderStatusUseCase } from '../../../application/use-cases/order.use-case';
import { formatAddress } from '../../../application/use-cases/stripe.use-case';

const poolClient = () => ({ query: jest.fn().mockResolvedValue({}), release: jest.fn() });
const poolWith = (client: ReturnType<typeof poolClient>) => ({ connect: jest.fn().mockResolvedValue(client) });

describe('GetOrderByIdUseCase', () => {
    const order = { id: 1, clientId: 5, status: 'succeeded' };
    const build = (found: unknown) => new GetOrderByIdUseCase({ findOrderById: jest.fn().mockResolvedValue(found) } as any);

    it('returns the order to its owner', async () => {
        expect(await build(order).execute({ orderId: 1, clientId: 5 })).toEqual([200, order]);
    });

    it('answers 404 (not 403) when another client asks, so ids cannot be probed', async () => {
        await expect(build(order).execute({ orderId: 1, clientId: 6 })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lets admins read any order', async () => {
        expect(await build(order).execute({ orderId: 1 })).toEqual([200, order]);
    });
});

describe('UpdateOrderStatusUseCase', () => {
    const build = (status: string | null) => {
        const client = poolClient();
        const orderRepository = {
            findOrderById: jest.fn().mockResolvedValue(status ? { id: 1, status } : null),
            updateOrderStatus: jest.fn().mockResolvedValue({ id: 1, status: 'next' }),
        };
        return { useCase: new UpdateOrderStatusUseCase(orderRepository as any, poolWith(client) as any), orderRepository, client };
    };

    it.each([['succeeded', 'processing'], ['processing', 'shipped'], ['shipped', 'delivered']])('allows %s -> %s', async (from, to) => {
        const { useCase, orderRepository, client } = build(from);
        await useCase.execute({ orderId: 1, status: to });
        expect(orderRepository.updateOrderStatus).toHaveBeenCalledWith(1, to, client);
        expect(client.release).toHaveBeenCalled();
    });

    it.each([['pending', 'processing'], ['succeeded', 'delivered'], ['delivered', 'shipped'], ['cancelled', 'processing']])('rejects %s -> %s with 409', async (from, to) => {
        const { useCase, orderRepository } = build(from);
        await expect(useCase.execute({ orderId: 1, status: to })).rejects.toMatchObject({ statusCode: 409 });
        expect(orderRepository.updateOrderStatus).not.toHaveBeenCalled();
    });

    it('answers 404 for an unknown order', async () => {
        await expect(build(null).useCase.execute({ orderId: 1, status: 'processing' })).rejects.toMatchObject({ statusCode: 404 });
    });
});

describe('ExpirePendingOrdersUseCase', () => {
    const build = (expired: Array<{ orderId: number; paymentIntentId: string | null }>, intentStatus = 'requires_payment_method') => {
        const client = poolClient();
        const orderRepository = {
            findExpiredPendingOrders: jest.fn().mockResolvedValue(expired),
            cancelPendingOrder: jest.fn().mockResolvedValue(true),
        };
        const stripeService = {
            retrievePaymentIntent: jest.fn().mockResolvedValue({ status: intentStatus }),
            cancelPaymentIntent: jest.fn().mockResolvedValue({}),
        };
        const useCase = new ExpirePendingOrdersUseCase(orderRepository as any, stripeService as any, poolWith(client) as any);
        return { useCase, orderRepository, stripeService, client };
    };

    it('cancels the PaymentIntent first, then the order in a transaction', async () => {
        const { useCase, orderRepository, stripeService, client } = build([{ orderId: 1, paymentIntentId: 'pi_1' }]);
        const result = await useCase.execute(30);

        expect(stripeService.cancelPaymentIntent).toHaveBeenCalledWith('pi_1');
        expect(orderRepository.cancelPendingOrder).toHaveBeenCalledWith(1, client);
        expect(client.query.mock.calls.map(c => c[0])).toEqual(['BEGIN', 'COMMIT']);
        expect(result).toEqual({ cancelled: 1, skipped: 0, failed: 0 });
    });

    it('skips orders whose payment is succeeded or processing (the webhook owns them)', async () => {
        for (const status of ['succeeded', 'processing']) {
            const { useCase, orderRepository, stripeService } = build([{ orderId: 1, paymentIntentId: 'pi_1' }], status);
            expect(await useCase.execute(30)).toEqual({ cancelled: 0, skipped: 1, failed: 0 });
            expect(stripeService.cancelPaymentIntent).not.toHaveBeenCalled();
            expect(orderRepository.cancelPendingOrder).not.toHaveBeenCalled();
        }
    });

    it('does not call Stripe again for an already cancelled intent', async () => {
        const { useCase, stripeService } = build([{ orderId: 1, paymentIntentId: 'pi_1' }], 'canceled');
        await useCase.execute(30);
        expect(stripeService.cancelPaymentIntent).not.toHaveBeenCalled();
    });

    it('cancels orders that never got a PaymentIntent without calling Stripe', async () => {
        const { useCase, stripeService } = build([{ orderId: 1, paymentIntentId: null }]);
        expect((await useCase.execute(30)).cancelled).toBe(1);
        expect(stripeService.retrievePaymentIntent).not.toHaveBeenCalled();
    });

    it('keeps going after a failure and rolls back that order', async () => {
        const { useCase, orderRepository, client } = build([{ orderId: 1, paymentIntentId: null }, { orderId: 2, paymentIntentId: null }]);
        orderRepository.cancelPendingOrder.mockRejectedValueOnce(new Error('db')).mockResolvedValueOnce(true);
        const result = await useCase.execute(30);

        expect(result).toEqual({ cancelled: 1, skipped: 0, failed: 1 });
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.release).toHaveBeenCalledTimes(2);
    });

    it('counts an order that was paid in the meantime as skipped', async () => {
        const { useCase, orderRepository } = build([{ orderId: 1, paymentIntentId: null }]);
        orderRepository.cancelPendingOrder.mockResolvedValue(false);
        expect(await useCase.execute(30)).toEqual({ cancelled: 0, skipped: 1, failed: 0 });
    });
});

describe('formatAddress', () => {
    it('joins the present parts', () => {
        expect(formatAddress({ id: 1, address_line1: 'Calle 1', address_line2: undefined, city: 'CDMX', state: 'CDMX', postal_code: '01000', country: 'MX', is_default: true }))
            .toBe('Calle 1, CDMX, CDMX, 01000, MX');
    });

    it('returns an empty string without an address', () => {
        expect(formatAddress(null)).toBe('');
    });
});
