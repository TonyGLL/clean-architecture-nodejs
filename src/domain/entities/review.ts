export class Review {
    constructor(
        public id: number,
        public client_id: number,
        public product_id: number,
        public rating: number,
        public title: string,
        public body: string,
        public approved: boolean,
        public deleted: boolean,
        public created_at: Date,
        public updated_at: Date
    ) { }
}
