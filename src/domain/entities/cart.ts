import { Product } from "./product";

export class Cart {
    constructor(
        public id: number,
        public clientId: number,
        public status: string = 'active',
        public createdAt: Date = new Date(),
        public items: Product[] = []
    ) { }
}