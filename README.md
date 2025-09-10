# Clean Architecture Node.js API

## Description

This project is a comprehensive e-commerce platform built with Node.js, Express.js, and TypeScript, following the principles of Clean Architecture. It features a robust RESTful API for backend management and includes a server-side rendered client interface using EJS. The platform covers everything from user authentication and product catalogs to a shopping cart and payment processing with Stripe. Its architecture emphasizes a clear separation of concerns, making the codebase modular, testable, and easy to maintain.

## Features

*   **Dual Authentication System:** Separate, secure authentication for both clients (shoppers) and administrators, including password recovery flows.
*   **Complete Admin Panel:** A comprehensive set of endpoints for administrators to manage users, roles, permissions (modules), and products.
*   **Role-Based Access Control (RBAC):** Secure admin endpoints using JWTs and a granular role/permission system.
*   **Full Product Catalog:** Endpoints for clients to search, view, and filter products by category.
*   **Shopping Cart:** Persistent shopping cart functionality for clients.
*   **Wishlist Management:** Allows clients to create and manage wishlists of their favorite products.
*   **Address Management:** Clients can save and manage multiple shipping addresses.
*   **Product Reviews:** Clients can leave reviews and ratings for products.
*   **Stripe Payment Integration:** A complete payment flow including saving payment methods, creating payments, and handling webhooks for order confirmation.
*   **Order Management:** Endpoints for creating and viewing order history.
*   **Automated Product Sync:** A daily cron job automatically fetches product data from an external API (`fakestoreapi.com`) to keep the catalog populated.
*   **Server-Side Views:** Includes EJS templates for client-facing pages like checkout and payment forms.
*   **Health Check Endpoint:** A `/health` endpoint to monitor the application's status and cron job activity.

## Technologies Used

*   **Core Frameworks and Libraries:**
    *   Node.js
    *   Express.js
    *   TypeScript
    *   EJS (View Engine)
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
*   **Development and Automation:**
    *   Docker and Docker Compose
    *   Nodemon (Live Reloading)
    *   `ts-node`
    *   Cron (for scheduled tasks)
*   **Logging and Security:**
    *   Winston (Application Logging)
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

Before you begin, make sure you have the following installed on your system:

*   **Node.js**: `v18.x` or higher is recommended.
*   **npm**: Comes with Node.js.
*   **Docker and Docker Compose**: Required for the containerized setup.
*   **PostgreSQL Client (`psql`)**: Required to run the database initialization script (`init-db.sh`) from your local machine.

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

Create a `.env` file in the project root. This file is essential for configuring the application, including database connections, JWT secrets, and external services like Stripe.

```env
PORT=3000

# JWT Secrets
JWT_SECRET_CLIENT=your_very_secret_jwt_key_for_clients
JWT_SECRET_ADMIN=your_very_secret_jwt_key_for_admins

# PostgreSQL Database
# Note: These are the defaults for the Docker Compose setup.
PSQL_HOST=localhost
PSQL_PORT=5432
PSQL_USER=root
PSQL_PASSWORD=secret
PSQL_DB=ca_nodejs

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@example.com

# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Running the Application with Docker Compose (Recommended)

This is the simplest way to get the entire stack—Node.js application and PostgreSQL database—running.

1.  **Start the services:**
    ```bash
    docker-compose up --build -d
    ```
    This command builds the images and starts the containers in detached mode. The application will be accessible at `http://localhost:3000`.

2.  **Initialize the Database:**
    With the database container running, execute the initialization script. This only needs to be done once.
    ```bash
    ./scripts/init-db.sh
    ```
    *   **Note for Windows Users**: This is a bash script. You can run it using Git Bash, WSL (Windows Subsystem for Linux), or by executing the `psql` commands inside the script manually.

    The script will create all necessary tables, insert initial data (like admin roles), and set up stored procedures.

### 5. Running the Application Manually (without Docker)

If you prefer to run the application outside of Docker, follow these steps:

1.  **Start your own PostgreSQL instance** and ensure it is accessible to the application.
2.  **Update your `.env` file** with the correct connection details for your database.
3.  **Initialize the database** using the `./scripts/init-db.sh` script as described above.
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The server will start with live reloading at `http://localhost:3000`.

### Building for Production

To compile the TypeScript code to JavaScript (output to the `dist` folder), run:
```bash
npm run build
```

## Automated Tasks (Cron Jobs)

This project includes automated tasks that run on a schedule.

*   **Product Catalog Synchronization:**
    *   **Schedule:** Runs daily at midnight (`0 0 * * *`).
    *   **Action:** Fetches product data from the public `https://fakestoreapi.com/products` API and upserts it into the database.
    *   **Purpose:** This keeps the product catalog populated with sample data automatically. The job is started when the application boots up.

## API Endpoints

All API endpoints are prefixed with `/api/v1`.

### Health Check

*   `GET /health`: Checks the application's status and the status of the cron job.

### Client-Facing Endpoints

#### Client Authentication (`/client/auth`)
*   `POST /register`: Register a new client.
*   `POST /login`: Log in as a client.
*   `POST /send-email`: Request an email to reset password.
*   `POST /restore-password`: Reset password with a token.

#### Product Catalog (`/products`)
*   `GET /search`: Search for products (e.g., `/search?q=shirt`).
*   `GET /:id`: Get details of a specific product.
*   `GET /categories/:id`: Get all products belonging to a specific category.

#### Shopping Cart (`/client/cart`)
*   `GET /`: Get the client's current cart.
*   `POST /add/:id`: Add a product to the cart.
*   `POST /address/:id`: Link a shipping address to the cart.
*   `DELETE /delete/:id`: Remove a product from the cart.
*   `DELETE /clear`: Empty the entire cart.

#### Address Management (`/client/address`)
*   `GET /`: Get all of the client's saved addresses.
*   `POST /`: Create a new address.
*   `GET /:id`: Get a specific address by ID.
*   `PUT /:id`: Update an address.
*   `DELETE /:id`: Delete an address.
*   `PATCH /default/:id`: Set an address as the default shipping address.

#### Wishlist Management (`/client/wishlist`)
*   `GET /`: Get all of the client's wishlists.
*   `POST /`: Create a new wishlist.
*   `GET /:id`: Get a specific wishlist by ID.
*   `PATCH /:id`: Update a wishlist's details (e.g., name).
*   `DELETE /:id`: Delete a wishlist.
*   `POST /add/:id`: Add a product to the default wishlist.
*   `DELETE /delete/:id`: Remove a product from the default wishlist.

#### Product Reviews (`/reviews`)
*   `GET /:productId`: Get all reviews for a specific product.
*   `POST /:productId`: Create a new review for a product (requires client authentication).
*   `DELETE /:reviewId`: Delete a review (requires client or admin authentication).

#### Payments with Stripe (`/client/stripe`)
*   `GET /payment-methods`: Get the client's saved payment methods.
*   `POST /payment-methods`: Add a new payment method.
*   `DELETE /payment-methods/:paymentMethodId`: Delete a saved payment method.
*   `POST /create-setup-intent`: Create a Stripe Setup Intent to save a card for future use.
*   `POST /create-payment-intent`: Create a Stripe Payment Intent to process a purchase.

### Stripe Webhooks

*   `POST /stripe-webhooks`: Handles incoming webhook events from Stripe to confirm payment status and update orders. Note: This endpoint has a different prefix for technical reasons related to Stripe's requirements.

### Admin Panel Endpoints (`/admin`)

All endpoints under `/admin` require admin authentication and appropriate role-based permissions.

#### Admin Authentication (`/admin/auth`)
*   `POST /login`: Log in as an admin.
*   `POST /send-email`: Request an email to reset an admin's password.
*   `POST /restore-password`: Reset an admin's password with a token.

#### Admin User Management (`/admin/users`)
*   `GET /`: Get a list of all admin users.
*   `POST /`: Create a new admin user.
*   `GET /:id`: Get details for a specific admin user.
*   `PATCH /:id`: Update an admin user's details.
*   `DELETE /:id`: Delete an admin user.
*   `PATCH /:id/password`: Change an admin user's password.
*   `POST /:id/roles`: Assign a role to an admin user.

#### Role Management (`/admin/roles`)
*   `GET /`: Get a list of all roles.
*   `POST /`: Create a new role.
*   `GET /:id`: Get permissions associated with a specific role.
*   `PUT /:id`: Update a role's details.
*   `DELETE /:id`: Delete a role.

#### Module (Permission) Management (`/admin/modules`)
*   `GET /`: Get a list of all available modules (permissions).
*   `POST /`: Create a new module.
*   `GET /:id`: Get details for a specific module.
*   `PUT /:id`: Update a module.
*   `DELETE /:id`: Delete a module.

## Server-Side Views (EJS)

In addition to the REST API, the project serves several client-facing pages using EJS templates. These pages are designed to provide a simple user interface for key parts of the e-commerce flow.

*   `GET /checkout`: A page that displays the shopping cart and allows the user to select a payment method to proceed with a purchase.
*   `GET /add-card`: A form for securely adding a new credit card using Stripe Elements.
*   `GET /success`: A simple page shown to the user after a successful purchase, displaying the order confirmation details.

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
