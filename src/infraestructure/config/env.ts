export const config = {
    PORT: process.env.PORT,
    JWT_SECRET_CLIENT: process.env.JWT_SECRET_CLIENT as string,
    JWT_SECRET_ADMIN: process.env.JWT_SECRET_ADMIN as string,
    PSQL_DB: process.env.PSQL_DB as string,
    PSQL_USER: process.env.PSQL_USER as string,
    PSQL_PASSWORD: process.env.PSQL_PASSWORD as string,
    PSQL_HOST: process.env.PSQL_HOST as string,
    PSQL_PORT: Number.parseInt(process.env.PSQL_PORT as string) as number,

    // Email configuration
    SMTP_HOST: process.env.SMTP_HOST as string,
    SMTP_PORT: Number.parseInt(process.env.SMTP_PORT as string) as number,
    SMTP_USER: process.env.SMTP_USER as string,
    SMTP_PASS: process.env.SMTP_PASS as string,
    EMAIL_FROM: process.env.EMAIL_FROM as string,
}