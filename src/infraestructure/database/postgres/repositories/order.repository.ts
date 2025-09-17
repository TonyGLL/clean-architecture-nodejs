import { query } from 'express-validator';
import { Pool, PoolClient } from 'pg';
import { inject, injectable } from 'inversify';
import { IOrderRepository, CreateOrderParams } from '../../../../domain/repositories/order.repository';
import { Order, OrderItem } from '../../../../domain/entities/order';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';
import { HttpError } from '../../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../../domain/shared/http.status';
import { GetAllOrdersDTO, GetAllOrdersResponseDTO } from '../../../../application/dtos/order.dto';

@injectable()
export class PostgresOrderRepository implements IOrderRepository {
    constructor(@inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool) { }

    public async getAllOrders(dto: GetAllOrdersDTO): Promise<GetAllOrdersResponseDTO> {
        try {
            const { page, limit, search, status, start_date, end_date } = dto;
            const offset = (page - 1) * limit;
            const client = await this.pool.connect();

            let baseQuery = 'SELECT * FROM orders';
            const conditions: string[] = [];
            const values: any[] = [];
            let valueIndex = 1;

            if (search) {
                conditions.push(`(order_number ILIKE $${valueIndex} OR id ILIKE $${valueIndex})`);
                values.push(`%${search}%`);
                valueIndex++;
            }
            if (status) {
                conditions.push(`status = $${valueIndex}`);
                values.push(status);
                valueIndex++;
            }
            if (start_date) {
                conditions.push(`created_at >= $${valueIndex}`);
                values.push(start_date);
                valueIndex++;
            }
            if (end_date) {
                conditions.push(`created_at <= $${valueIndex}`);
                values.push(end_date);
                valueIndex++;
            }

            if (conditions.length > 0) {
                baseQuery += ' WHERE ' + conditions.join(' AND ');
            }

            baseQuery += ' ORDER BY created_at DESC';
            baseQuery += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;

            const queryTotal = `SELECT COUNT(*) FROM orders` + (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '');
            const totalResult = await client.query(queryTotal, values.slice(0, valueIndex - 1));
            const total = parseInt(totalResult.rows[0].count, 10);

            values.push(limit, offset);

            const { rows } = await client.query<Order>(baseQuery, values);
            return { total, orders: rows };
        } catch (error) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Error fetching orders: ${(error as Error).message}`);
        }
    }

    private generateOrderNumber(): string {
        // Simple order number generator, consider a more robust solution for production
        const prefix = "ORD";
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `${prefix}-${timestamp}-${randomSuffix}`;
    }

    public async createOrder(params: CreateOrderParams, poolClient: PoolClient): Promise<Order> {
        const orderNumber = this.generateOrderNumber();
        const orderStatus = 'pending';

        const orderResult = await poolClient.query(
            `INSERT INTO orders (client_id, order_number, total_amount, status, shipping_address, billing_address, payment_method)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, client_id, order_number, total_amount, status, shipping_address, billing_address, created_at, updated_at`,
            [
                params.clientId,
                orderNumber,
                params.cart.total,
                orderStatus,
                params.shippingAddress,
                params.billingAddress,
                params.paymentMethod,
            ]
        );
        const newOrder = orderResult.rows[0];
        const orderItems: OrderItem[] = [];

        for (const cartItem of params.cart.items) {
            // The cartItem is expected to have product details including quantity in cart.
            const productPrice = cartItem.price;
            const itemSubtotal = cartItem.quantity * productPrice;

            // Decrease product stock and check for availability
            const stockUpdateResult = await poolClient.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id',
                [cartItem.quantity, cartItem.id]
            );

            if (stockUpdateResult.rowCount === 0) {
                // If rowCount is 0, it means the WHERE condition (stock >= quantity) failed.
                throw new HttpError(HttpStatusCode.CONFLICT, `Insufficient stock for product: ${cartItem.name} (ID: ${cartItem.id})`);
            }

            const orderItemResult = await poolClient.query(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id, order_id, product_id, quantity, unit_price, subtotal`,
                [newOrder.id, cartItem.id, cartItem.quantity, productPrice, itemSubtotal]
            );
            orderItems.push(orderItemResult.rows[0] as OrderItem);
        }

        return new Order(
            newOrder.id,
            newOrder.client_id,
            newOrder.order_number,
            parseFloat(newOrder.total_amount),
            newOrder.status,
            newOrder.shipping_address,
            newOrder.billing_address,
            newOrder.payment_id,
            newOrder.created_at,
            newOrder.updated_at,
            orderItems
        );
    }

    public async findOrderById(orderId: number): Promise<Order | null> {
        const client = await this.pool.connect();
        try {
            const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
            if (orderResult.rows.length === 0) return null;

            const orderData = orderResult.rows[0];
            const itemsResult = await client.query(
                `SELECT oi.*, p.name as product_name, p.image as product_image
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = $1`,
                [orderId]
            );

            const orderItems = itemsResult.rows.map(item => new OrderItem(
                item.id, item.order_id, item.product_id, item.quantity, parseFloat(item.unit_price), parseFloat(item.subtotal)
            ));

            return new Order(
                orderData.id, orderData.client_id, orderData.order_number, parseFloat(orderData.total_amount),
                orderData.status, orderData.shipping_address, orderData.billing_address, orderData.payment_id,
                orderData.created_at, orderData.updated_at, orderItems
            );
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Error finding order: ${error.message}`);
        } finally {
            client.release();
        }
    }

    public async findOrdersByClientId(clientId: number): Promise<Order[]> {
        const client = await this.pool.connect();
        try {
            // This query could be complex if fetching all items for all orders.
            // Consider pagination or fetching items separately if performance is an issue.
            const ordersResult = await client.query('SELECT * FROM orders WHERE client_id = $1 ORDER BY created_at DESC', [clientId]);
            if (ordersResult.rows.length === 0) return [];

            const orders: Order[] = [];
            for (const orderData of ordersResult.rows) {
                const itemsResult = await client.query(
                    `SELECT oi.*, p.name as product_name, p.image as product_image
                      FROM order_items oi
                      JOIN products p ON oi.product_id = p.id
                      WHERE oi.order_id = $1`,
                    [orderData.id]
                );
                const orderItems = itemsResult.rows.map(item => new OrderItem(
                    item.id, item.order_id, item.product_id, item.quantity, parseFloat(item.unit_price), parseFloat(item.subtotal)
                ));
                orders.push(new Order(
                    orderData.id, orderData.client_id, orderData.order_number, parseFloat(orderData.total_amount),
                    orderData.status, orderData.shipping_address, orderData.billing_address, orderData.payment_id,
                    orderData.created_at, orderData.updated_at, orderItems
                ));
            }
            return orders;
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Error finding client orders: ${error.message}`);
        } finally {
            client.release();
        }
    }

    public async updateOrderStatus(orderId: number, status: string, poolClient: PoolClient): Promise<Order | null> {
        const result = await poolClient.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, orderId]
        );
        if (result.rows.length === 0) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Order not found for status update.');
        }
        // For simplicity, returning the updated order data without re-fetching items.
        // A full Order object reconstruction might be needed depending on use case.
        const orderData = result.rows[0];
        return await this.findOrderById(orderData.id); // Re-fetch to include items
    }
}
