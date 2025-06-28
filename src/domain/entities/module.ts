export class Module {
    private constructor(
        public id: string | null,
        public name: string,
        public description: string,
        public createdAt?: Date,
        public updatedAt?: Date
    ) { }

    static create(
        id: string,
        name: string,
        description: string,
        createdAt: Date = new Date(),
        updatedAt: Date = new Date()
    ): Module {
        return new Module(id, name, description, createdAt, updatedAt);
    }
}