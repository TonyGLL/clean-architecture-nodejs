import { Pool, PoolClient } from 'pg';
import { inject, injectable } from 'inversify';
import { IOrderRepository, CreateOrderParams } from '../../../../domain/repositories/order.repository';
import { Order, OrderItem } from '../../../../domain/entities/order';
import { INFRASTRUCTURE_TYPES } from '../../../ioc/types';
import { HttpError } from '../../../../domain/errors/http.error';
import { HttpStatusCode } from '../../../../domain/shared/http.status';
import { Product } from '../../../../domain/entities/product'; // For mapping product details

@injectable()
export class PostgresOrderRepository implements IOrderRepository {
    constructor(@inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool) {}

    private generateOrderNumber(): string {
        // Simple order number generator, consider a more robust solution for production
        const prefix = "ORD";
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `${prefix}-${timestamp}-${randomSuffix}`;
    }

    async createOrder(params: CreateOrderParams): Promise<Order> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const orderNumber = this.generateOrderNumber();
            const orderStatus = 'pending'; // Initial status

            const orderResult = await client.query(
                `INSERT INTO orders (client_id, order_number, total_amount, status, shipping_address, billing_address, payment_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                 RETURNING id, client_id, order_number, total_amount, status, shipping_address, billing_address, payment_id, created_at, updated_at`,
                [
                    params.clientId,
                    orderNumber,
                    params.cart.total, // Total amount from cart
                    orderStatus,
                    params.shippingAddress,
                    params.billingAddress,
                    params.paymentId,
                ]
            );
            const newOrder = orderResult.rows[0];
            const orderItems: OrderItem[] = [];

            for (const cartItem of params.cart.items) {
                // Ensure cartItem has necessary properties (product_id, quantity, unit_price)
                // The Product entity in cart.items might need to be mapped from CartItemDTO if it's not already a Product instance
                // For this example, assuming cartItem has product_id, quantity, and unit_price (price at time of cart addition)

                const productPrice = cartItem.price; // price from Product entity which is CartItemDTO actually
                const itemSubtotal = cartItem.quantity * productPrice;

                const orderItemResult = await client.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id, order_id, product_id, quantity, unit_price, subtotal`,
                    [newOrder.id, cartItem.id, cartItem.quantity, productPrice, itemSubtotal]
                );
                orderItems.push(orderItemResult.rows[0] as OrderItem);

                // Optionally, decrease product stock (important for inventory management)
                // await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [cartItem.quantity, cartItem.product_id]);
                // Add error handling for insufficient stock if not checked before payment
            }

            await client.query('COMMIT');

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

        } catch (error: any) {
            await client.query('ROLLBACK');
            // Log error for debugging
            console.error("Error creating order:", error);
            if (error.code === '23503') { // foreign_key_violation
                 throw new HttpError(HttpStatusCode.BAD_REQUEST, `Invalid reference: ${error.detail || error.message}`);
            }
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Error creating order: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async findOrderById(orderId: number): Promise<Order | null> {
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
                item.id, item.order_id, item.product_id, item.quantity, parseFloat(item.unit_price), parseFloat(item.subtotal),
                // new Product(item.product_id, item.product_name, '', parseFloat(item.unit_price), 0, '', item.product_image) // Simplified Product for display
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

    async findOrdersByClientId(clientId: number): Promise<Order[]> {
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
                    item.id, item.order_id, item.product_id, item.quantity, parseFloat(item.unit_price), parseFloat(item.subtotal),
                    // new Product(item.product_id, item.product_name, '', parseFloat(item.unit_price), 0, '', item.product_image)
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

    async updateOrderStatus(orderId: number, status: string): Promise<Order | null> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
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
        } catch (error: any) {
            if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Error updating order status: ${error.message}`);
        } finally {
            client.release();
        }
    }
}
