# Clean Architecture Node.js API

## Description

This project is a RESTful API built with Node.js, Express.js, and TypeScript, following Clean Architecture principles. It provides a robust foundation for building scalable and maintainable backend services with a primary focus on user authentication and management. The architecture emphasizes separation of concerns, making the codebase modular, testable, and easy to evolve.

## Features

*   **Dual Authentication System:**
    *   **Client Authentication:** Allows new clients (customers) to register, log in, and manage their accounts (e.g., password reset via email).
    *   **Admin Authentication:** Separate authentication for admin users with JWT-based session tokens.
*   **Secure Password Management:** Uses `bcryptjs` to hash passwords for both clients and admin users.
*   **Role-Based Access Control (RBAC) for Admin Panel:** Secures admin API endpoints using JSON Web Tokens and role-based permissions.
*   **Admin User and Role Management:** Provides CRUD operations for managing admin users and their roles/permissions.
*   **Module Management (Admin):** Allows admins to perform CRUD operations on system modules, which are used for defining permissions.
*   **Product Catalog Management:**
    *   Admins can upsert products and their categories via a stored procedure.
    *   Clients can search for products, view product details, and list products by category.
*   **Shopping Cart Functionality (Client):**
    *   Clients can add products to their cart.
    *   View cart details.
    *   Remove products from the cart.
    *   Clear the entire cart.
*   **Health Check:** A dedicated endpoint (`/health`) to monitor API status.

## Technologies Used

*   **Core:**
    *   Node.js
    *   Express.js
    *   TypeScript
*   **Database:**
    *   PostgreSQL
*   **Architecture & Design:**
    *   Clean Architecture
    *   Dependency Injection (InversifyJS)
*   **Authentication & Authorization:**
    *   JSON Web Tokens (JWT)
    *   `bcryptjs` (Password Hashing)
*   **Validation:**
    *   `express-validator`
*   **Email:**
    *   Nodemailer
*   **Development & Tooling:**
    *   Docker & Docker Compose
    *   Nodemon (for live reloading during development)
    *   `ts-node`
*   **Security & Logging:**
    *   Helmet (Security Headers)
    *   Morgan (HTTP Request Logging)
    *   CORS

## Project Structure

The project adheres to Clean Architecture principles, dividing the codebase into distinct layers:

*   **Domain:** Contains the core business logic, entities, and domain-specific interfaces. This layer is independent of any framework or infrastructure concerns.
    *   `src/domain/entities/`: Business objects (e.g., `User`, `Role`, `Client`, `Product`, `Cart`, `Module`).
    *   `src/domain/repositories/`: Interfaces for data access (e.g., `IUserRepository`, `IRoleRepository`, `IClientRepository`, `IProductsRepository`, `ICartRepository`, `IModulesRepository`).
    *   `src/domain/services/`: Domain-specific services (e.g., `HashingService`, `MailService`).
    *   `src/domain/errors/`: Custom error classes.
    *   `src/domain/shared/`: Shared utilities like HTTP status codes.
*   **Application:** Orchestrates the use cases of the application. It depends on the Domain layer but not on the Infrastructure layer.
    *   `src/application/use-cases/`: Application-specific business rules (e.g., `AuthUseCase` for admins, `AuthClientUseCase` for clients, `UserUseCase`, `RoleUseCase`, `ProductsUseCase`, `CartUseCase`, `ModulesUseCase`).
    *   `src/application/services/`: Application-level services (e.g., `JwtService`).
    *   `src/application/dtos/`: Data Transfer Objects used by use cases for input and output.
*   **Infrastructure:** Implements the interfaces defined in the Application and Domain layers. This layer includes frameworks, databases, external service integrations, and UI components.
    *   `src/infraestructure/config/`: Environment configuration (`env.ts`).
    *   `src/infraestructure/database/`: PostgreSQL connection, repository implementations (e.g., `PostgresUserRepository`, `PostgresProductsRepository`), and potentially database helper functions.
    *   `src/infraestructure/driven/services/`: Implementations of external services (e.g., `NodemailerMailService`).
    *   `src/infraestructure/http/`: Express.js related code:
        *   `controllers/`: Handle incoming HTTP requests and orchestrate responses using application use cases.
        *   `routes/`: Define API endpoints and link them to controllers.
        *   `middlewares/`: Custom middleware for tasks like authentication, validation error handling.
        *   `validators/`: Request validation rules using `express-validator`.
    *   `src/infraestructure/ioc/`: InversifyJS dependency injection container setup (`config.ts`, `types.ts`).
*   **Main:** The entry point of the application (`src/main/server.ts`), responsible for initializing and starting the server and setting up the Express application (`src/main/app.ts`).
*   **Database Schema (`src/db/`)**:
    *   `schema.sql`: Contains DDL statements for creating tables and defining relationships.
    *   `inserts.sql`: Sample data or initial seed data for lookup tables (e.g., initial roles, modules).
    *   `stored-procedures/`: Contains SQL scripts for creating stored procedures, organized by domain (e.g., `roles/upsert_products_with_categories.sql`).
    *   **Note on Sqitch:** The README previously mentioned Sqitch. While Sqitch files might exist at the root for migration management, the `src/db/` directory contains raw SQL scripts that are crucial for understanding the database structure and initial state. The interaction between Sqitch and these files should be clarified in the "Database Schema Initialization" section.

## Prerequisites

Before you begin, ensure you have the following installed:

*   Node.js (v18.x or later recommended)
*   npm (or yarn)
*   Docker (optional, for running with Docker Compose)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url> # Replace <repository-url> with the actual URL
cd clean-architecture-nodejs
```

### 2. Install Dependencies

```bash
npm install
# or
# yarn install
```

### 3. Set Up Environment Variables

This project requires environment variables for configuration. If you are **not** using Docker Compose for the database, you'll need to set up a PostgreSQL instance and configure variables for it.

Create a `.env` file in the root of the project. For local development, especially if using Docker Compose, the `docker-compose.yml` references a `dev.env` file for the application service. You can use this file.

**Example `.env` / `dev.env` content:**
```env
PORT=3000

# JWT
JWT_SECRET=your_very_secret_jwt_key_here

# PostgreSQL Database
# These are used if running the Node app directly and managing your own DB instance.
# If using docker-compose.yml, the DB connection string is often set directly there for the app service (see DB_SOURCE in docker-compose.yml).
PSQL_HOST=localhost
PSQL_PORT=5432
PSQL_USER=your_db_user
PSQL_PASSWORD=your_db_password
PSQL_DB=your_db_name

# Email Configuration (e.g., using Mailtrap.io or a real SMTP server)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port # e.g., 2525 for Mailtrap
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@example.com
```

**Note on Docker Compose Database:**
If you use the provided `docker-compose.yml`:
*   A PostgreSQL service is defined with user `root`, password `secret`, and database `ca_nodejs`.
*   The `app_dev` service in `docker-compose.yml` is configured to connect to this database via the `DB_SOURCE` environment variable.
*   You will primarily need to ensure `JWT_SECRET` and email-related variables are set in your `.env` or `dev.env` file.

### 4. Initialize Database Schema

The project's database schema is defined by SQL files located in the `src/db/` directory:
*   `src/db/schema.sql`: Contains all `CREATE TABLE` statements and defines relationships, covering entities like clients, users, products, categories, shopping carts, orders, roles, and modules.
*   `src/db/inserts.sql`: Contains initial `INSERT` statements for populating lookup tables such as `modules`, `roles`, and `role_permissions`.
*   `src/db/stored-procedures/`: This directory houses SQL scripts for creating stored procedures. For example, `roles/upsert_products_with_categories.sql` defines a procedure to bulk add/update products and manage their categories.

**Primary Method (Manual Execution or via Custom Script):**

For development or initial setup, you would typically execute these SQL scripts directly against your PostgreSQL database. The order is important:
1.  `src/db/schema.sql` (to create all tables and structures)
2.  `src/db/inserts.sql` (to populate initial data)
3.  Scripts within `src/db/stored-procedures/` (to create stored procedures)

*   **If using Docker Compose (Recommended):**
    1.  Ensure the database container is running: `docker-compose up -d db`. The `db` service in `docker-compose.yml` uses the `postgres` image and is configured with `POSTGRES_USER=root`, `POSTGRES_PASSWORD=secret`, `POSTGRES_DB=ca_nodejs`.
    2.  You can connect to this database using a PostgreSQL client (like `psql` or a GUI tool) and run the SQL scripts.
        *   Host: `localhost` (or the Docker machine IP if not on Linux)
        *   Port: `5432` (as mapped in `docker-compose.yml`)
        *   User: `root`
        *   Password: `secret`
        *   Database: `ca_nodejs`
    3.  Alternatively, you can use `docker cp` to copy the SQL files into the container and then `docker-compose exec db psql ...` to execute them. For example:
        ```bash
        docker cp src/db/schema.sql $(docker-compose ps -q db):/tmp/schema.sql
        docker-compose exec db psql -U root -d ca_nodejs -f /tmp/schema.sql
        # Repeat for inserts.sql and stored procedures
        docker cp src/db/inserts.sql $(docker-compose ps -q db):/tmp/inserts.sql
        docker-compose exec db psql -U root -d ca_nodejs -f /tmp/inserts.sql
        docker cp src/db/stored-procedures/roles/upsert_products_with_categories.sql $(docker-compose ps -q db):/tmp/upsert_products_with_categories.sql
        docker-compose exec db psql -U root -d ca_nodejs -f /tmp/upsert_products_with_categories.sql
        # Add other stored procedures as needed
        ```

*   **If running PostgreSQL manually:**
    1.  Ensure your PostgreSQL server is running.
    2.  Use `psql` or another PostgreSQL client to connect to your database.
    3.  Execute `schema.sql`, then `inserts.sql`, then the stored procedure scripts.
        ```bash
        psql -U your_user -d your_database -f src/db/schema.sql
        psql -U your_user -d your_database -f src/db/inserts.sql
        psql -U your_user -d your_database -f src/db/stored-procedures/roles/upsert_products_with_categories.sql
        # Add other stored procedures as needed
        ```

**Note on Sqitch (If Applicable):**
The project structure also includes files that suggest the use of [Sqitch](https://sqitch.org/) for database change management (e.g., `sqitch.plan`, `sqitch.conf`, `deploy/`, `revert/`, `verify/` directories typically found at the project root).

*   If Sqitch is actively being used and these `src/db/*.sql` files are part of Sqitch migrations (e.g., a Sqitch `deploy` script executes them or incorporates their content), then the Sqitch workflow would be the primary way to manage and deploy database changes.
*   **To deploy using Sqitch (if configured):**
    *   Ensure Sqitch is installed.
    *   Configure your database target in `sqitch.conf` or via `SQITCH_TARGET` environment variable.
    *   Run `sqitch deploy` (potentially within the `app_dev` Docker container if Sqitch is set up there: `docker-compose exec app_dev sqitch deploy`).
*   **Clarification Needed:** If both Sqitch and manual SQL script execution are options, the preferred method for consistent schema management should be established and documented. If `src/db/schema.sql` represents the complete current schema, Sqitch might be used to manage incremental changes from this baseline.

**Adding New Database Changes (e.g., Stored Procedures, Schema Modifications):**
*   **If using manual script management:**
    1.  Modify `src/db/schema.sql` for table changes.
    2.  Add new `.sql` files for new stored procedures in `src/db/stored-procedures/`.
    3.  Ensure these are applied in the correct order.
*   **If using Sqitch:**
    1.  Add a new migration: `sqitch add my_new_change -n "Description of change."`
    2.  Edit the generated `deploy/my_new_change.sql`, `revert/my_new_change.sql`, and `verify/my_new_change.sql` files.
    3.  Commit changes and run `sqitch deploy`.
    It's important that the contents of `src/db/schema.sql` and `src/db/stored-procedures/` are reflected in or managed by Sqitch changes if Sqitch is the chosen tool for migrations.

### 5. Run the Development Server (without Docker)

```bash
npm run dev
```
The server will start, typically on `http://localhost:3000` (or the `PORT` specified in your `.env` file).

### 6. Running with Docker Compose (Recommended for Development)

The project includes `Dockerfile` and `docker-compose.yml` for a containerized setup.

1.  Ensure Docker is running.
2.  Ensure you have a `.env` or `dev.env` file as configured in `docker-compose.yml` (for `JWT_SECRET`, email settings, etc.). The database connection is handled by `DB_SOURCE` in `docker-compose.yml`.
3.  Build and start the services:
    ```bash
    docker-compose up --build -d # -d runs in detached mode
    ```
    This will start the Node.js application (`app_dev` service) and a PostgreSQL database (`db` service) pre-configured to work together. The application will be available on `http://localhost:3000`.
4.  **Initialize the Database Schema:** Once the `db` service is running, follow the instructions in step 4 ("Initialize Database Schema") to set up the tables, initial data, and stored procedures. This might involve running SQL scripts manually via a DB client connected to the Dockerized PostgreSQL, using `docker cp` and `docker-compose exec db psql`, or running Sqitch commands if that's your project's standard.
5.  To see logs: `docker-compose logs -f app_dev db`
6.  To stop: `docker-compose down`

## API Endpoints

All API endpoints are prefixed with `/api/v1`.

### Client Authentication (`/client/auth`)

*   `POST /client/auth/register`: Register a new client (customer).
    *   **Body:** `{ "name": "John", "lastName": "Doe", "email": "john.doe@example.com", "password": "securePassword123", "birth_date": "YYYY-MM-DD" (optional), "phone": "1234567890" (optional) }`
*   `POST /client/auth/login`: Log in an existing client.
    *   **Body:** `{ "email": "john.doe@example.com", "password": "securePassword123" }`
    *   **Response:** JWT token.
*   `POST /client/auth/send-email`: Request a password reset email for a client.
    *   **Body:** `{ "email": "john.doe@example.com" }`
*   `POST /client/auth/restore-password`: Restore client password using a token from the reset email.
    *   **Body:** `{ "email": "john.doe@example.com", "token": "your_reset_token", "password": "newSecurePassword456" }`

### Product Catalog (`/products`)

These endpoints are generally for client access and do not require authentication unless specified.

*   `GET /products/search?q=<query>`: Search for products based on a query string.
    *   **Query Params:** `q` (string, search term).
    *   **Response:** Array of product objects.
*   `GET /products/:id`: Get details for a specific product.
    *   **Path Params:** `id` (number, product ID).
    *   **Response:** Product object.
*   `GET /products/categories/:id`: Get all products belonging to a specific category.
    *   **Path Params:** `id` (number, category ID).
    *   **Response:** Array of product objects.

### Client Shopping Cart (`/client/cart`)

These endpoints require client authentication (JWT token obtained from client login). The client ID is typically inferred from the authenticated user's token.

*   `GET /client/cart`: Get the current client's shopping cart details.
    *   **Authentication:** Client JWT required.
    *   **Response:** Cart object with items, subtotal, taxes, total.
*   `POST /client/cart/add/:id`: Add a product to the client's shopping cart.
    *   **Authentication:** Client JWT required.
    *   **Path Params:** `id` (number, product ID to add).
    *   **Body:** `{ "quantity": 1 }`
    *   **Response:** `204 No Content` on success.
*   `DELETE /client/cart/delete/:id`: Remove a specific product from the client's shopping cart.
    *   **Authentication:** Client JWT required.
    *   **Path Params:** `id` (number, product ID to remove).
    *   **Response:** `204 No Content` on success.
*   `DELETE /client/cart/clear`: Clear all items from the client's shopping cart.
    *   **Authentication:** Client JWT required.
    *   **Response:** `204 No Content` on success.

### Admin Panel (`/admin`)

All endpoints under `/admin` require admin authentication (JWT token obtained from admin login) and appropriate role-based permissions.

#### Admin Authentication (`/admin/auth`)
*   `POST /admin/auth/login`: Log in an admin user. (Equivalent to `/client/auth/login` but for admin users, usually pointing to a different user table/logic).
    *   **Body:** `{ "email": "admin@example.com", "password": "adminPassword123" }`
    *   **Response:** JWT token.
    *(Note: The README previously listed only client auth. If admin auth has a distinct endpoint, it should be listed. If it uses the same endpoint but different logic based on user type, that should be clarified. Assuming a separate logical controller for admin auth as per general structure.)*

#### Admin User Management (`/admin/users`)

*   `GET /admin/users`: Get a list of admin users.
*   `GET /admin/users/:id`: Get admin user details.
*   `POST /admin/users`: Create a new admin user.
*   `PUT /admin/users/:id`: Update an admin user.
*   `DELETE /admin/users/:id`: Delete an admin user.
*   `PATCH /admin/users/:id/password`: Change an admin user's password.
*   `POST /admin/users/:id/roles`: Assign a role to an admin user.

#### Admin Role Management (`/admin/roles`)

*   `GET /admin/roles`: Get a list of roles.
*   `GET /admin/roles/:id`: Get permissions for a specific role.
*   `POST /admin/roles`: Create a new role.
*   `PUT /admin/roles/:id`: Update a role.
*   `DELETE /admin/roles/:id`: Delete a role.

#### Admin Module Management (`/admin/modules`)

*   `GET /admin/modules`: Get a list of all modules.
*   `GET /admin/modules/:id`: Get details for a specific module.
    *   **Path Params:** `id` (string, module ID).
*   `POST /admin/modules`: Create a new module.
    *   **Body:** `{ "name": "NewModule", "description": "Description for NewModule" }`
*   `PUT /admin/modules/:id`: Update an existing module.
    *   **Path Params:** `id` (string, module ID).
    *   **Body:** `{ "name": "UpdatedModuleName", "description": "Updated description" }`
*   `DELETE /admin/modules/:id`: Delete a module.
    *   **Path Params:** `id` (string, module ID).

### Health Check (`/health`)

*   `GET /health`: Check the health status of the API.
    *   **Response:** `{ "ok": true }`

## Running Tests

This project uses `jest` for testing. To run the tests, use the following command:

```bash
npm test
```

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the ISC License (as per `package.json`).
