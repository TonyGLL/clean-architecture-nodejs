export class Product {
    private constructor(
        public id: number,
        public name: string,
        public description: string,
        public price: number,
        public image: string,
        public category: string,
        public sku: string,
        public stock: number = 100,
        public quantity: number = 0,
        public reviews: number = 0,
        public rating: number = 0
    ) { }

    public static create(
        id: number,
        name: string,
        description: string,
        price: number,
        image: string,
        category: string,
        sku: string,
        stock: number = 100,
        quantity: number = 0,
        reviews: number = 0,
        rating: number = 0
    ): Product {
        return new Product(id, name, description, price, image, category, sku, stock, quantity, reviews, rating);
    }
}