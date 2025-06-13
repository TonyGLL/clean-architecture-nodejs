export const config = {
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET as string,
    PSQL_DB: process.env.PSQL_DB as string,
    PSQL_USER: process.env.PSQL_USER as string,
    PSQL_PASSWORD: process.env.PSQL_PASSWORD as string,
    PSQL_HOST: process.env.PSQL_HOST as string,
    PSQL_PORT: Number.parseInt(process.env.PSQL_PORT as string) as number
}