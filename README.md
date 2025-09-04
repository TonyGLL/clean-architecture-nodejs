# Clean Architecture Node.js API

## Description

This project is a RESTful API built with Node.js, Express.js, and TypeScript, following the principles of Clean Architecture. It provides a solid foundation for building scalable and maintainable backend services, with a primary focus on user authentication and management, product catalog, shopping cart, and payment processing. The architecture emphasizes separation of concerns, making the codebase modular, testable, and easy to evolve.

## Features

*   **Dual Authentication System:**
    *   **Client Authentication:** Allows new customers (shoppers) to register, log in, and manage their accounts (e.g., reset password via email).
    *   **Admin Authentication:** Separate authentication for admin users with JWT-based session tokens.
*   **Secure Password Management:** Uses `bcryptjs` to hash the passwords of both clients and admin users.
*   **Role-Based Access Control (RBAC) for the Admin Panel:** Secures the admin API endpoints using JSON Web Tokens and role-based permissions.
*   **Admin User and Role Management:** Provides CRUD operations to manage admin users and their roles/permissions.
*   **Module Management (Admin):** Allows admins to perform CRUD operations on system modules, which are used to define permissions.
*   **Product Catalog Management:**
    *   Admins can insert or update products and their categories through a stored procedure.
    *   Clients can search for products, view product details, and list products by category.
*   **Shopping Cart Functionality (Client):**
    *   Clients can add products to their cart.
    *   View cart details.
    *   Remove products from the cart.
    *   Empty the entire cart.
*   **Payment Integration with Stripe:**
    *   Management of client payment methods.
    *   Creation of Payment Intents to process transactions.
    *   Handling of Stripe webhooks to update the status of payments and orders.
*   **Order Management:**
    *   Creation of orders after a successful payment.
    *   Viewing order history for clients.
    *   Updating the status of orders (e.g., pending, shipped, delivered).
*   **Health Check:** A dedicated endpoint (`/health`) to monitor the API's status.

## Technologies Used

*   **Core:**
    *   Node.js
    *   Express.js
    *   TypeScript
*   **Database:**
    *   PostgreSQL
*   **Architecture and Design:**
    *   Clean Architecture
    *   Dependency Injection (InversifyJS)
*   **Authentication and Authorization:**
    *   JSON Web Tokens (JWT)
    *   `bcryptjs` (Password Hashing)
*   **Payments:**
    *   Stripe
*   **Validation:**
    *   `express-validator`
*   **Email:**
    *   Nodemailer
*   **Development and Tools:**
    *   Docker and Docker Compose
    *   Nodemon (for live reloading during development)
    *   `ts-node`
*   **Security and Logging:**
    *   Helmet (Security Headers)
    *   Morgan (HTTP Request Logging)
    *   CORS

## Project Structure

The project adheres to the principles of Clean Architecture, dividing the codebase into distinct layers:

*   **Domain:** Contains the core business logic, entities, and domain-specific interfaces. This layer is independent of any framework or infrastructure concerns.
    *   `src/domain/entities/`: Business objects (e.g., `User`, `Role`, `Client`, `Product`, `Cart`, `Module`, `Order`, `Payment`).
    *   `src/domain/repositories/`: Interfaces for data access (e.g., `IUserRepository`, `IRoleRepository`, `IProductsRepository`, `ICartRepository`, `IOrderRepository`, `IStripePaymentRepository`).
    *   `src/domain/services/`: Domain-specific services (e.g., `HashingService`, `MailService`, `StripeService`).
*   **Application:** Orchestrates the application's use cases. It depends on the Domain layer but not on the Infrastructure layer.
    *   `src/application/use-cases/`: Application-specific business rules (e.g., `AuthUseCase`, `ProductsUseCase`, `CartUseCase`, `OrderUseCase`, `StripeUseCase`).
    *   `src/application/services/`: Application-level services (e.g., `JwtService`).
    *   `src/application/dtos/`: Data Transfer Objects (DTOs) used by the use cases for input and output.
*   **Infrastructure:** Implements the interfaces defined in the Application and Domain layers. This layer includes frameworks, databases, external service integrations, and UI components.
    *   `src/infraestructure/config/`: Environment configuration (`env.ts`).
    *   `src/infraestructure/database/`: PostgreSQL connection, repository implementations.
    *   `src/infraestructure/driven/services/`: Implementations of external services (e.g., `NodemailerMailService`, `StripeServiceImpl`).
    *   `src/infraestructure/http/`: Express.js-related code:
        *   `controllers/`: Handle HTTP requests and orchestrate responses.
        *   `routes/`: Define the API endpoints.
        *   `middlewares/`: Custom middleware for tasks like authentication and validation.
        *   `validators/`: Request validation rules with `express-validator`.
    *   `src/infraestructure/ioc/`: Configuration of the InversifyJS dependency injection container.
*   **Main:** The application's entry point (`src/main/server.ts`), responsible for initializing and starting the server.
*   **Database Schema (`src/db/`)**:
    *   `schema.sql`: Contains the DDL statements to create tables and define relationships.
    *   `inserts.sql`: Initial data for tables (e.g., roles, modules).
    *   `stored-procedures/`: SQL scripts to create stored procedures.

## Prerequisites

Before you begin, make sure you have the following installed:

*   Node.js (v18.x or higher recommended)
*   npm (or yarn)
*   Docker (optional, for running with Docker Compose)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root. You can use the `dev.env` file as a template.

**Example content for `.env`:**
```env
PORT=3000

# JWT
JWT_SECRET=your_very_secret_jwt_key_here

# PostgreSQL Database (if not using Docker)
PSQL_HOST=localhost
PSQL_PORT=5432
PSQL_USER=your_db_user
PSQL_PASSWORD=your_db_password
PSQL_DB=your_db_name

# Email Configuration (e.g., Mailtrap.io)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@example.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Note on the Database with Docker Compose:**
If you use `docker-compose.yml`, it defines a PostgreSQL service with default credentials (`user: root`, `password: secret`). **These are insecure and should not be used in a production environment.** It is strongly recommended to change these credentials in your `docker-compose.yml` file and use a secure password. The application connects to this database through the `DB_SOURCE` environment variable defined in `docker-compose.yml`.

### 4. Initialize the Database

A script is provided to automate the database initialization process. This script will create the necessary tables, insert initial data, and create stored procedures.

**To initialize the database:**

1.  Make sure your Docker container for the database is running (`docker-compose up -d db`).
2.  Run the initialization script:
    ```bash
    ./scripts/init-db.sh
    ```
    The script uses the following default environment variables for the database connection, which match the `docker-compose.yml` setup:
    *   `POSTGRES_HOST=localhost`
    *   `POSTGRES_PORT=5432`
    *   `POSTGRES_USER=root`
    *   `POSTGRES_PASSWORD=secret`
    *   `POSTGRES_DB=ca_nodejs`

    If you are not using Docker or have different credentials, you can set these environment variables before running the script.

### 5. Run the Development Server (without Docker)

```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 6. Run with Docker Compose

1.  Make sure Docker is running.
2.  Create your `.env` file as described in step 3.
3.  Build and start the services:
    ```bash
    docker-compose up --build -d
    ```
    This will start the Node.js application and the PostgreSQL database. The application will be available at `http://localhost:3000`.
4.  **Initialize the database** as described in step 4.

## API Endpoints

All API endpoints are prefixed with `/api/v1`.

### Client Authentication (`/client/auth`)

*   `POST /client/auth/register`: Register a new client.
*   `POST /client/auth/login`: Log in as a client.
*   `POST /client/auth/send-email`: Request an email to reset the password.
*   `POST /client/auth/restore-password`: Reset the password with a token.

### Product Catalog (`/products`)

*   `GET /products/search?q=<query>`: Search for products.
*   `GET /products/:id`: Get details of a product.
*   `GET /products/categories/:id`: Get products by category.

### Client Shopping Cart (`/client/cart`)

*   `GET /client/cart`: Get the client's cart.
*   `POST /client/cart/add/:id`: Add a product to the cart.
*   `DELETE /client/cart/delete/:id`: Remove a product from the cart.
*   `DELETE /client/cart/clear`: Empty the cart.

### Payments with Stripe (`/client/stripe`)

*   `POST /client/stripe/create-setup-intent`: Create a setup intent to save a card.
*   `POST /client/stripe/payment-methods`: Add a payment method.
*   `GET /client/stripe/payment-methods`: Get the client's payment methods.
*   `DELETE /client/stripe/payment-methods/:paymentMethodId`: Delete a payment method.
*   `POST /client/stripe/create-payment-intent`: Create a payment intent to process a purchase.

### Stripe Webhooks (`/stripe/webhook`)

*   `POST /stripe/webhook`: Handle Stripe webhook events (e.g., `payment_intent.succeeded`).

### Admin Panel (`/admin`)

All endpoints under `/admin` require admin authentication.

#### Admin Authentication (`/admin/auth`)
*   `POST /admin/auth/login`: Log in as an admin.

#### Admin User Management (`/admin/users`)
*   `GET /admin/users`: Get a list of admin users.
*   `POST /admin/users`: Create a new admin user.
*   ... (full CRUD)

#### Role Management (`/admin/roles`)
*   `GET /admin/roles`: Get a list of roles.
*   `POST /admin/roles`: Create a new role.
*   ... (full CRUD)

#### Module Management (`/admin/modules`)
*   `GET /admin/modules`: Get a list of modules.
*   `POST /admin/modules`: Create a new module.
*   ... (full CRUD)

### Health Check (`/health`)

*   `GET /health`: Check the API's status.

## Run Tests

```bash
npm test
```

## Contributions

Contributions are welcome. Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the ISC License.
