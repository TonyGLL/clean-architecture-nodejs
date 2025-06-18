export interface LoginUserDTO {
    email: string;
    password: string;
}

export interface RegisterUserDTO {
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