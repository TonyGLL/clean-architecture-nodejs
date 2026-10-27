import { inject, injectable } from "inversify";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { IOrderRepository } from "../../domain/repositories/order.repository";
import { GetAllOrdersDTO, GetAllOrdersResponseDTO, GetClientOrdersDTO, GetOrderByIdDTO, UpdateOrderStatusDTO } from "../dtos/order.dto";
import { Order } from "../../domain/entities/order";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { Pool } from "pg";
import { INFRASTRUCTURE_TYPES } from "../../infraestructure/ioc/types";

@injectable()
export class GetOrderByIdUseCase {
    constructor(@inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository) { }

    public async execute(dto: GetOrderByIdDTO): Promise<[number, Order | null]> {
        const order = await this.orderRepository.findOrderById(dto.orderId);
        if (!order) {
            return [HttpStatusCode.NOT_FOUND, null];
        }
        // Authorization: Ensure client owns the order or user is admin
        if (dto.clientId && order.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.FORBIDDEN, "Access denied to this order.");
        }
        return [HttpStatusCode.OK, order];
    }
}

@injectable()
export class GetClientOrdersUseCase {
    constructor(@inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository) { }

    public async execute(dto: GetClientOrdersDTO): Promise<[number, Order[]]> {
        const orders = await this.orderRepository.findOrdersByClientId(dto.clientId);
        return [HttpStatusCode.OK, orders];
    }
}

@injectable()
export class UpdateOrderStatusUseCase {
    // This use case might be restricted to admins
    constructor(
        @inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository,
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async execute(dto: UpdateOrderStatusDTO): Promise<[number, Order | null]> {
        const poolClient = await this.pool.connect();

        try {
            const updatedOrder = await this.orderRepository.updateOrderStatus(dto.orderId, dto.status, poolClient);
            if (!updatedOrder) {
                return [HttpStatusCode.NOT_FOUND, null];
            }
            return [HttpStatusCode.OK, updatedOrder];
        } finally {
            poolClient.release();
        }
    }
}

@injectable()
export class GetAllOrdersUseCase {
    constructor(@inject(DOMAIN_TYPES.IOrderRepository) private orderRepository: IOrderRepository) { }

    public async execute(dto: GetAllOrdersDTO): Promise<[number, GetAllOrdersResponseDTO]> {
        const response = await this.orderRepository.getAllOrders(dto);
        return [HttpStatusCode.OK, response];
    }
}