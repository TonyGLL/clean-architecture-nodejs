import { Client } from "../../domain/entities/client";

export interface LoginClientDTO {
    email: string;
    password: string;
}

export interface RegisterClientDTO {
    name: string;
    lastName: string;
    email: string;
    password: string;
    birth_date?: Date;
    phone?: string;
}

export interface RestorePasswordDTO {
    email: string;
    token: string;
    password: string;
}

export type AuthClientResponseDTO = {
    client: Omit<Client, 'password'>;
    token: string;
}