import { injectable } from "inversify";
import { IPaypalService } from "../../../domain/services/paypal.service";
import * as paypal from '@paypal/checkout-server-sdk';
import { CreateOrderPayload, Order } from "@paypal/checkout-server-sdk/lib/orders/lib";
import { env } from "../../config/env";

@injectable()
export class PaypalService implements IPaypalService {
    private client: any;

    constructor() {
        this.client = this.configureClient();
    }

    private configureClient() {
        const clientId = env.PAYPAL_CLIENT_ID;
        const clientSecret = env.PAYPAL_CLIENT_SECRET;
        const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
        return new paypal.core.PayPalHttpClient(environment);
    }

    async createOrder(payload: CreateOrderPayload): Promise<Order> {
        const request = new paypal.orders.OrdersCreateRequest();
        request.requestBody(payload);
        const response = await this.client.execute(request);
        return response.result;
    }

    async captureOrder(orderId: string): Promise<Order> {
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        const response = await this.client.execute(request);
        return response.result;
    }

    async getOrder(orderId: string): Promise<Order> {
        const request = new paypal.orders.OrdersGetRequest(orderId);
        const response = await this.client.execute(request);
        return response.result;
    }
}
