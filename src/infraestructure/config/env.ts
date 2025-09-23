import { z } from 'zod';

// Define the schema for the environment variables
const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    JWT_SECRET_CLIENT: z.string().min(1, "JWT_SECRET_CLIENT is required"),
    JWT_SECRET_ADMIN: z.string().min(1, "JWT_SECRET_ADMIN is required"),
    PSQL_DB: z.string().min(1, "PSQL_DB is required"),
    PSQL_USER: z.string().min(1, "PSQL_USER is required"),
    PSQL_PASSWORD: z.string().min(1, "PSQL_PASSWORD is required"),
    PSQL_HOST: z.string().min(1, "PSQL_HOST is required"),
    PSQL_PORT: z.coerce.number().int().positive("PSQL_PORT must be a positive integer"),

    // Email configuration
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
    SMTP_PORT: z.coerce.number().int().positive("SMTP_PORT must be a positive integer"),
    SMTP_USER: z.string().min(1, "SMTP_USER is required"),
    SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
    EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email"),

    // Stripe configuration
    STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
    STRIPE_PUBLIC_KEY: z.string().min(1, "STRIPE_PUBLIC_KEY is required"),
    STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
});

// Parse the environment variables
const parsedConfig = envSchema.safeParse(process.env);

// If parsing fails, log the errors and exit
if (!parsedConfig.success) {
    console.error("❌ Invalid environment variables:", parsedConfig.error.flatten().fieldErrors);
    process.exit(1);
}

// Export the validated and typed config
export const config = parsedConfig.data;