export class Wishlist {

    constructor(
        public readonly id: number | null,
        public client_id: number,
        public name: string,
        public readonly created_at?: Date,
        public readonly updated_at?: Date
    ) {
    }
}