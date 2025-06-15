export interface LoginUserDTO {
    email: string;
    password: string;
}

export interface RegisterUserDTO {
    name: string;
    lastName: string;
    email: string;
    password: string;
    role: number;
    age?: number;
    phone?: string;
}