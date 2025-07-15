import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { CreatePaymentIntentUseCase, CreateSetupIntentUseCase, DeletePaymentMethodUseCase, GetClientPaymentMethodsUseCase } from "../../../application/use-cases/stripe.use-case";
import { AddPaymentMethodDTO, CreatePaymentIntentDTO, DeletePaymentMethodDTO } from "../../../application/dtos/payment.dto";

@injectable()
export class StripeController {
    constructor(
        @inject(GetClientPaymentMethodsUseCase) private getClientPaymentMethodsUseCase: GetClientPaymentMethodsUseCase,
        @inject(DeletePaymentMethodUseCase) private deletePaymentMethodUseCase: DeletePaymentMethodUseCase,
        @inject(CreatePaymentIntentUseCase) private createPaymentIntentUseCase: CreatePaymentIntentUseCase,
        @inject(CreateSetupIntentUseCase) private createSetupIntentUseCase: CreateSetupIntentUseCase
    ) { }

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
            const { currency, paymentMethodId } = req.body;

            const dto: CreatePaymentIntentDTO = {
                clientId,
                currency,
                paymentMethodId
            };
            const [status, data] = await this.createPaymentIntentUseCase.execute(dto);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public createSetupIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clientId = req.user!.id;

            const [status, data] = await this.createSetupIntentUseCase.execute(clientId);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}
