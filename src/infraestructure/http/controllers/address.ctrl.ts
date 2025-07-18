import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { CreateAddressUseCase, DeleteAddressUseCase, GetAddressByClientIdUseCase, GetAddressByIdUseCase, SetDefaultAddressUseCase, UpdateAddressUseCase } from "../../../application/use-cases/address.use-case";

@injectable()
export class AddressController {
    constructor(
        @inject(CreateAddressUseCase) private createAddressUseCase: CreateAddressUseCase,
        @inject(GetAddressByClientIdUseCase) private getAddressByClientIdUseCase: GetAddressByClientIdUseCase,
        @inject(GetAddressByIdUseCase) private getAddressByIdUseCase: GetAddressByIdUseCase,
        @inject(UpdateAddressUseCase) private updateAddressUseCase: UpdateAddressUseCase,
        @inject(DeleteAddressUseCase) private deleteAddressUseCase: DeleteAddressUseCase,
        @inject(SetDefaultAddressUseCase) private setDefaultAddressUseCase: SetDefaultAddressUseCase
    ) { }

    public createAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.user as { id: number };
            const [status, data] = await this.createAddressUseCase.execute(id, req.body);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public getAddressByClientId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.user as { id: number };
            const [status, data] = await this.getAddressByClientIdUseCase.execute(id);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public getAddressById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as { id: string };
            const [status, data] = await this.getAddressByIdUseCase.execute(+id);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public updateAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as { id: string };
            const [status, data] = await this.updateAddressUseCase.execute(+id, req.body);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as { id: string };
            const [status, data] = await this.deleteAddressUseCase.execute(+id);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }

    public setDefaultAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id: clientId } = req.user as { id: number };
            const { id: addressId } = req.params as { id: string };
            const [status, data] = await this.setDefaultAddressUseCase.execute(clientId, +addressId);
            res.status(status).json(data);
        } catch (error) {
            next(error);
        }
    }
}
