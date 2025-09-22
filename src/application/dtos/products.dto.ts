import { Product } from "../../domain/entities/product";

export interface IFakeStoreAPIProduct {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
}

export interface ISearchProductsDTO {
    limit: number;
    page: number;
    search?: string;
}

export interface IGetProductsByCategoryDTO {
    categoryId: number;
    limit: number;
    page: number;
}

export interface ISearchProductsResponseDTO {
    products: Product[];
    total: number;
}