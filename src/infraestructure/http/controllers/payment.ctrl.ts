import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { AddPaymentMethodUseCase, ConfirmPaymentUseCase, CreatePaymentIntentUseCase, DeletePaymentMethodUseCase, GetClientPaymentMethodsUseCase } from "../../../application/use-cases/payment.use-case";
import { AddPaymentMethodDTO, ConfirmPaymentDTO, CreatePaymentIntentDTO, DeletePaymentMethodDTO } from "../../../application/dtos/payment.dto";

@injectable()
export class PaymentController {
    constructor(
        @inject(AddPaymentMethodUseCase) private addPaymentMethodUseCase: AddPaymentMethodUseCase,
        @inject(GetClientPaymentMethodsUseCase) private getClientPaymentMethodsUseCase: GetClientPaymentMethodsUseCase,
        @inject(DeletePaymentMethodUseCase) private deletePaymentMethodUseCase: DeletePaymentMethodUseCase,
        @inject(CreatePaymentIntentUseCase) private createPaymentIntentUseCase: CreatePaymentIntentUseCase,
        @inject(ConfirmPaymentUseCase) private confirmPaymentUseCase: ConfirmPaymentUseCase
    ) { }

    public addPaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user!.id; // Assuming user ID is on req.user from auth middleware
            const { stripePaymentMethodId, isDefault } = req.body;

            const dto: AddPaymentMethodDTO = { clientId, stripePaymentMethodId, isDefault };
            const [status, data] = await this.addPaymentMethodUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public getClientPaymentMethods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user!.id;
            const [status, data] = await this.getClientPaymentMethodsUseCase.execute({ clientId });
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public deletePaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user!.id;
            const { paymentMethodId } = req.params; // Stripe Payment Method ID (pm_xxx)

            const dto: DeletePaymentMethodDTO = { clientId, paymentMethodId };
            const [status, data] = await this.deletePaymentMethodUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user!.id;
            const { currency, paymentMethodId, saveCard, confirm, metadata } = req.body;

            const dto: CreatePaymentIntentDTO = {
                clientId,
                currency,
                paymentMethodId,
                saveCard,
                confirm,
                metadata
            };
            const [status, data] = await this.createPaymentIntentUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public confirmPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user!.id;
            const { paymentIntentId } = req.params;
            const { paymentMethodId } = req.body; // Optional, depending on confirmation flow

            const dto: ConfirmPaymentDTO = { clientId, paymentIntentId, paymentMethodId };
            const [status, data] = await this.confirmPaymentUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}
