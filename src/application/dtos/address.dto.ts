import { Address } from "../../domain/entities/address";

export type CreateAddressDto = Omit<Address, 'id'>;
export type UpdateAddressDto = Partial<Omit<Address, 'id'>>;
