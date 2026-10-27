
import { Order } from "../../domain/entities/order";

export interface GetOrderByIdDTO {
    orderId: number;
    clientId?: number; // Optional: for authorization, ensure client owns the order
}

export interface GetClientOrdersDTO {
    clientId: number;
}

export interface UpdateOrderStatusDTO {
    orderId: number;
    status: string;
    // Potentially add adminUserId for authorization if only admins can update status
}

export interface GetAllOrdersDTO {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

export interface GetAllOrdersResponseDTO {
    total: number;
    orders: Order[];
}