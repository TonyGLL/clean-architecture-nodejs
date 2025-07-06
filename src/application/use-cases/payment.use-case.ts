import { inject, injectable } from "inversify";
import { IPaymentRepository } from "../../domain/repositories/payment.repository";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { AddPaymentMethodDTO, ClientPaymentMethodsDTO, ConfirmPaymentDTO, CreatePaymentIntentDTO, DeletePaymentMethodDTO } from "../dtos/payment.dto";
import { HttpError } from "../../domain/errors/http.error";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { PaymentMethod } from "../../domain/entities/paymentMethod";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { AttachPaymentMethodParams, CreateCustomerParams, CreatePaymentIntentParams, IPaymentService, PaymentIntent } from "../../domain/services/payment.service";

@injectable()
export class AddPaymentMethodUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository
    ) { }

    public async execute(dto: AddPaymentMethodDTO): Promise<[number, PaymentMethod]> {
        let client = await this.paymentRepository.findClientById(dto.clientId);
        if (!client) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");
        }

        if (!client.stripe_customer_id) {
            const customerParams: CreateCustomerParams = {
                email: client.email,
                name: client.name,
                metadata: { client_id: client.id.toString() }
            };
            const customer = await this.paymentService.createCustomer(customerParams);
            await this.paymentRepository.updateClientStripeCustomerId(client.id, customer.id);
            client.stripe_customer_id = customer.id;
        }

        try {
            const paymentMethodParams: AttachPaymentMethodParams = {
                customerId: client.stripe_customer_id,
                paymentMethodId: dto.stripePaymentMethodId,
            };
            const domainPaymentMethod = await this.paymentService.attachPaymentMethodToCustomer(paymentMethodParams);

            const existingMethod = await this.paymentRepository.findPaymentMethodByStripeId(domainPaymentMethod.id);
            if (existingMethod) {
                if (existingMethod.clientId !== dto.clientId) {
                    throw new HttpError(HttpStatusCode.CONFLICT, "Payment Method is already associated with another client.");
                }
                if (dto.isDefault) {
                    await this.paymentRepository.setDefaultPaymentMethod(dto.clientId, existingMethod.id);
                    existingMethod.isDefault = true;
                }
                return [HttpStatusCode.OK, existingMethod];
            }

            const newPaymentMethod = await this.paymentRepository.addPaymentMethod(
                dto.clientId,
                domainPaymentMethod.id,
                domainPaymentMethod.card?.brand || null,
                domainPaymentMethod.card?.last4 || null,
                domainPaymentMethod.card?.exp_month || null,
                domainPaymentMethod.card?.exp_year || null,
                dto.isDefault || false
            );
            return [HttpStatusCode.CREATED, newPaymentMethod];
        } catch (error: any) {
            if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to add payment method: ${error.message}`);
        }
    }
}

@injectable()
export class GetClientPaymentMethodsUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository
    ) { }

    public async execute(dto: ClientPaymentMethodsDTO): Promise<[number, PaymentMethod[]]> {
        const paymentMethods = await this.paymentRepository.getClientPaymentMethods(dto.clientId);
        return [HttpStatusCode.OK, paymentMethods];
    }
}

@injectable()
export class DeletePaymentMethodUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository
    ) { }

    public async execute(dto: DeletePaymentMethodDTO): Promise<[number, object]> {
        const paymentMethod = await this.paymentRepository.findPaymentMethodByStripeId(dto.paymentMethodId);
        if (!paymentMethod || paymentMethod.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment method not found or does not belong to the client.");
        }

        try {
            await this.paymentService.detachPaymentMethod(dto.paymentMethodId);
            await this.paymentRepository.deletePaymentMethod(paymentMethod.id);
            return [HttpStatusCode.NO_CONTENT, {}];
        } catch (error: any) {
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to delete payment method: ${error.message}`);
        }
    }
}

@injectable()
export class CreatePaymentIntentUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository,
        @inject(DOMAIN_TYPES.ICartRepository) private cartRepository: ICartRepository
    ) { }

    public async execute(dto: CreatePaymentIntentDTO): Promise<[number, { clientSecret: string | null; paymentIntentId: string; requiresAction: boolean; status: string; }]> {
        const client = await this.paymentRepository.findClientById(dto.clientId);
        if (!client) throw new HttpError(HttpStatusCode.NOT_FOUND, "Client not found");

        const cart = await this.cartRepository.getCartDetails(dto.clientId, dto.cartId);
        if (!cart) throw new HttpError(HttpStatusCode.NOT_FOUND, "Cart not found");
        if (cart.total !== dto.amount) {
            throw new HttpError(HttpStatusCode.BAD_REQUEST, "Cart total does not match the payment amount.");
        }

        let customerId = client.stripe_customer_id;
        if (!customerId) {
            const customer = await this.paymentService.createCustomer({ email: client.email, name: client.name, metadata: { client_id: client.id.toString() } });
            await this.paymentRepository.updateClientStripeCustomerId(client.id, customer.id);
            customerId = customer.id;
        }

        let paymentIntent: PaymentIntent;

        try {
            const existingPayment = await this.paymentRepository.findPaymentByIntentId(cart.activePaymentIntentId || '');
            if (existingPayment?.stripePaymentIntentId && (existingPayment.status === 'pending' || existingPayment.status === 'requires_action')) {
                paymentIntent = await this.paymentService.retrievePaymentIntent(existingPayment.stripePaymentIntentId);
                if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(paymentIntent.status)) {
                    return [HttpStatusCode.OK, { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, requiresAction: paymentIntent.status === 'requires_action', status: paymentIntent.status }];
                } else if (paymentIntent.status === 'succeeded') {
                    throw new HttpError(HttpStatusCode.CONFLICT, "Payment for this cart has already succeeded.");
                }
            }

            const createPaymentIntentParams: CreatePaymentIntentParams = {
                amount: dto.amount,
                currency: dto.currency,
                customerId: customerId,
                paymentMethodId: dto.paymentMethodId,
                confirm: dto.confirm || false,
                metadata: { ...dto.metadata, cart_id: dto.cartId.toString(), client_id: dto.clientId.toString() },
                description: `Payment for cart ${dto.cartId}`
            };
            paymentIntent = await this.paymentService.createPaymentIntent(createPaymentIntentParams);

            await this.paymentRepository.createPaymentRecord({
                cartId: dto.cartId,
                clientId: dto.clientId,
                amount: dto.amount,
                currency: dto.currency,
                status: paymentIntent.status,
                stripePaymentIntentId: paymentIntent.id,
                stripeChargeId: null,
                paymentMethodDetails: null, // Will be populated by webhook
                receiptUrl: null,
                paymentDate: null,
                orderId: null,
            });

            await this.cartRepository.updateCartPaymentIntent(dto.cartId, paymentIntent.id);

            return [HttpStatusCode.CREATED, { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, requiresAction: paymentIntent.status === 'requires_action', status: paymentIntent.status }];
        } catch (error: any) {
            if (error instanceof HttpError) throw error;
            throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, `Failed to create payment intent: ${error.message}`);
        }
    }
}

@injectable()
export class ConfirmPaymentUseCase {
    constructor(
        @inject(DOMAIN_TYPES.IPaymentService) private paymentService: IPaymentService,
        @inject(DOMAIN_TYPES.IPaymentRepository) private paymentRepository: IPaymentRepository
    ) { }

    public async execute(dto: ConfirmPaymentDTO): Promise<[number, { paymentIntentId: string; status: string; requiresAction: boolean; clientSecret?: string | null; chargeId?: string; receiptUrl?: string }]> {
        const localPayment = await this.paymentRepository.findPaymentByIntentId(dto.paymentIntentId);
        if (!localPayment || localPayment.clientId !== dto.clientId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, "Payment intent not found or does not belong to the client.");
        }

        if (localPayment.status === 'succeeded') {
            return [HttpStatusCode.OK, { paymentIntentId: localPayment.stripePaymentIntentId!, status: localPayment.status, requiresAction: false, chargeId: localPayment.stripeChargeId || undefined, receiptUrl: localPayment.receiptUrl || undefined }];
        }

        try {
            let paymentIntent: PaymentIntent;
            if (localPayment.status === 'requires_confirmation' || (localPayment.status === 'requires_payment_method' && dto.paymentMethodId)) {
                paymentIntent = await this.paymentService.confirmPaymentIntent(dto.paymentIntentId, { paymentMethodId: dto.paymentMethodId });
            } else {
                paymentIntent = await this.paymentService.retrievePaymentIntent(dto.paymentIntentId);
            }

            const charge = paymentIntent.charges?.data[0];

            await this.paymentRepository.updatePaymentStatus(
                paymentIntent.id,
                paymentIntent.status,
                charge?.id,
                charge?.receipt_url!,
                paymentIntent.status === 'succeeded' ? new Date(charge?.created! * 1000) : undefined,
                charge?.payment_method_details
            );

            return [HttpStatusCode.OK, {
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
                requiresAction: paymentIntent.status === 'requires_action',
                clientSecret: paymentIntent.client_secret,
                chargeId: charge?.id,
                receiptUrl: charge?.receipt_url!
            }];
        } catch (error: any) {
            if (error instanceof HttpError) throw error;
            // A more specific error check for card errors might be needed depending on the payment service abstraction
            await this.paymentRepository.updatePaymentStatus(dto.paymentIntentId, 'failed');
            throw new HttpError(HttpStatusCode.BAD_REQUEST, `Failed to confirm payment: ${error.message}`);
        }
    }
}
