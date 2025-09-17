import { Order } from "../entities/order";
import { Cart } from "../entities/cart";
import { PoolClient } from "pg";
import { GetAllOrdersDTO, GetAllOrdersResponseDTO } from "../../application/dtos/order.dto";

/**
 * @interface CreateOrderParams
 * @desc Interface for creating an order
 */
export interface CreateOrderParams {
    clientId: number;
    cart: Cart; // Pass the whole cart to extract items and total
    paymentMethod: string; // ID of the successful payment record
    shippingAddress: string; // Or a structured address object
    billingAddress: string; // Or a structured address object
}

/**
 * @interface IOrderRepository
 * @desc Interface for order repository
 */
export interface IOrderRepository {
    /**
     * @method createOrder
     * @param {CreateOrderParams} params
     * @param {PoolClient} poolClient
     * @returns {Promise<Order>}
     * @desc Create a new order
     */
    createOrder(params: CreateOrderParams, poolClient: PoolClient): Promise<Order>;

    /**
     * @method findOrderById
     * @param {number} orderId
     * @returns {Promise<Order | null>}
     * @desc Find an order by its ID
     */
    findOrderById(orderId: number): Promise<Order | null>;

    /**
     * @method findOrdersByClientId
     * @param {number} clientId
     * @returns {Promise<Order[]>}
     * @desc Find all orders for a client
     */
    findOrdersByClientId(clientId: number): Promise<Order[]>;

    /**
     * @method updateOrderStatus
     * @param {number} orderId
     * @param {string} status
     * @param {PoolClient} poolClient
     * @returns {Promise<Order | null>}
     * @desc Update the status of an order
     */
    updateOrderStatus(orderId: number, status: string, poolClient: PoolClient): Promise<Order | null>;


    /** * @method getAllOrders
     * @param {GetAllOrdersDTO} dto
     * @returns {Promise<GetAllOrdersResponseDTO>}
     * @desc Get all orders with pagination, filtering, and search
     */
    getAllOrders(dto: GetAllOrdersDTO): Promise<GetAllOrdersResponseDTO>;
}
