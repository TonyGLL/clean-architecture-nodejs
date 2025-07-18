import { inject, injectable } from "inversify";
import { IAddressRepository } from "../../domain/repositories/address.repository";
import { CreateAddressDto, UpdateAddressDto } from "../dtos/address.dto";
import { HttpStatusCode } from "../../domain/shared/http.status";
import { DOMAIN_TYPES } from "../../domain/ioc.types";
import { Address } from "../../domain/entities/address";
import { HttpError } from "../../domain/errors/http.error";

@injectable()
export class CreateAddressUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IAddressRepository) private addressRepository: IAddressRepository
    ) { }

    public async execute(clientId: number, dto: CreateAddressDto): Promise<[number, Address]> {
        return [HttpStatusCode.CREATED, await this.addressRepository.create(clientId, dto)];
    }
}

@injectable()
export class GetAddressByClientIdUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IAddressRepository) private addressRepository: IAddressRepository
    ) { }

    public async execute(id: number): Promise<[number, Address[]]> {
        const address = await this.addressRepository.findByClientId(id);
        if (!address) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Address not found');
        return [HttpStatusCode.OK, address];
    }
}

@injectable()
export class GetAddressByIdUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IAddressRepository) private addressRepository: IAddressRepository
    ) { }

    public async execute(id: number): Promise<[number, Address]> {
        const address = await this.addressRepository.findById(id);
        if (!address) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Address not found');
        return [HttpStatusCode.OK, address];
    }
}

@injectable()
export class UpdateAddressUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IAddressRepository) private addressRepository: IAddressRepository
    ) { }

    public async execute(id: number, dto: UpdateAddressDto): Promise<[number, Address]> {
        return [HttpStatusCode.CREATED, await this.addressRepository.update(id, dto)];
    }
}

@injectable()
export class DeleteAddressUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IAddressRepository) private addressRepository: IAddressRepository
    ) { }

    public async execute(id: number): Promise<[number, object]> {
        await this.addressRepository.delete(id);
        return [HttpStatusCode.NO_CONTENT, {}];
    }
}

@injectable()
export class SetDefaultAddressUseCase {

    constructor(
        @inject(DOMAIN_TYPES.IAddressRepository) private addressRepository: IAddressRepository
    ) { }

    public async execute(clientId: number, addressId: number): Promise<[number, object]> {
        await this.addressRepository.setDefault(clientId, addressId);
        return [HttpStatusCode.OK, { message: 'Address seted as default successfully' }];
    }
}
